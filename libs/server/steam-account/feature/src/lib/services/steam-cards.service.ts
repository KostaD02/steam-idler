import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import axios from 'axios';

import { buildCacheKey, CacheService } from '@steam-idler/server/infra/cache';
import {
  EncryptionService,
  ExceptionService,
} from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { SteamAccountRepository } from '@steam-idler/server/steam-account/domain';
import {
  GameWithCards,
  SteamAccountExceptionKeys,
} from '@steam-idler/server/steam-account/types';

const CARDS_CACHE_TTL = 24 * 60 * 60 * 1000;
const IDLING_REFRESH_INTERVAL = 25 * 60 * 1000;
const STALE_THRESHOLD = 10 * 60 * 1000;
const MIN_REFRESH_INTERVAL = 3 * 60 * 1000;
const MAX_BADGE_PAGES = 50;
const REQUEST_TIMEOUT = 15000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

@Injectable()
export class SteamCardsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SteamCardsService.name);
  private readonly lastRefreshAt = new Map<string, number>();
  private readonly inFlight = new Map<string, Promise<GameWithCards[]>>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly steamAccountRepository: SteamAccountRepository,
    private readonly encryptionService: EncryptionService,
    private readonly exceptionService: ExceptionService,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit(): void {
    this.refreshTimer = setInterval(() => {
      this.refreshIdlingAccounts().catch((error) => {
        this.logger.error('Scheduled card refresh failed', error);
      });
    }, IDLING_REFRESH_INTERVAL);
  }

  onModuleDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async getCards(accountName: string): Promise<GameWithCards[]> {
    const cached = await this.cacheService.get<GameWithCards[]>(
      this.cardsKey(accountName),
    );

    if (cached === undefined) {
      return this.refreshCards(accountName);
    }

    if (this.isStale(accountName)) {
      this.refreshSilently(accountName);
    }

    return cached;
  }

  refreshCards(accountName: string): Promise<GameWithCards[]> {
    const existing = this.inFlight.get(accountName);

    if (existing) {
      return existing;
    }

    const refresh = this.scrapeAndCache(accountName).finally(() => {
      this.inFlight.delete(accountName);
    });

    this.inFlight.set(accountName, refresh);

    return refresh;
  }

  private async scrapeAndCache(accountName: string): Promise<GameWithCards[]> {
    const account = await this.steamAccountRepository.getByName(accountName);

    if (!account) {
      this.exceptionService.throw(
        ExceptionStatusKeys.NotFound,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    const steamId = account.credentials.id;
    const cookies = this.encryptionService.decryptList(
      account.credentials.cookies,
    );

    if (!steamId || cookies.length === 0) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam session is not ready to read trading cards',
        [SteamAccountExceptionKeys.CardsUnavailable],
      );
    }

    const games = await this.scrapeBadges(steamId, cookies);
    await this.cacheService.set(
      this.cardsKey(accountName),
      games,
      CARDS_CACHE_TTL,
    );
    this.lastRefreshAt.set(accountName, Date.now());

    return games;
  }

  async refreshSilently(accountName: string): Promise<void> {
    const last = this.lastRefreshAt.get(accountName) ?? 0;

    if (Date.now() - last < MIN_REFRESH_INTERVAL) {
      return;
    }

    try {
      await this.refreshCards(accountName);
    } catch (error) {
      this.logger.warn(`Card refresh failed for ${accountName}`, error);
    }
  }

  private isStale(accountName: string): boolean {
    const last = this.lastRefreshAt.get(accountName) ?? 0;

    return Date.now() - last > STALE_THRESHOLD;
  }

  private async refreshIdlingAccounts(): Promise<void> {
    const accounts = await this.steamAccountRepository.getAll();

    for (const account of accounts) {
      if (
        account.idleSettings.idleEnabled &&
        account.credentials.id &&
        account.credentials.cookies.length > 0
      ) {
        await this.refreshSilently(account.accountName);
      }
    }
  }

  private async scrapeBadges(
    steamId: string,
    cookies: string[],
  ): Promise<GameWithCards[]> {
    const headers = {
      Cookie: cookies.join('; '),
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const firstPage = await this.fetchBadgePage(steamId, cookies, 1, headers);
    this.assertAuthenticated(firstPage);

    const pageCount = Math.min(this.parsePageCount(firstPage), MAX_BADGE_PAGES);
    const games = new Map<number, GameWithCards>();

    this.collectBadgeRows(firstPage, games);

    for (let page = 2; page <= pageCount; page++) {
      const html = await this.fetchBadgePage(steamId, cookies, page, headers);
      this.collectBadgeRows(html, games);
    }

    return [...games.values()].sort(
      (a, b) =>
        (b.cardsRemaining ?? 0) - (a.cardsRemaining ?? 0) ||
        a.name.localeCompare(b.name),
    );
  }

  private async fetchBadgePage(
    steamId: string,
    cookies: string[],
    page: number,
    headers: Record<string, string>,
  ): Promise<string> {
    try {
      const response = await axios.get<string>(
        `https://steamcommunity.com/profiles/${steamId}/badges/?l=english&p=${page}`,
        { headers, timeout: REQUEST_TIMEOUT, responseType: 'text' },
      );

      return response.data;
    } catch {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Failed to read trading cards from Steam',
        [SteamAccountExceptionKeys.CardsUnavailable],
      );
    }
  }

  private assertAuthenticated(html: string): void {
    if (html.includes('g_steamID = false')) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam session expired while reading trading cards',
        [SteamAccountExceptionKeys.CardsUnavailable],
      );
    }
  }

  private parsePageCount(html: string): number {
    const pages = [
      ...html.matchAll(/class="pagelink"[^>]*>\s*([\d,]+)\s*</g),
    ].map((match) => Number(match[1].replace(/,/g, '')));

    return pages.length > 0 ? Math.max(...pages, 1) : 1;
  }

  private collectBadgeRows(
    html: string,
    games: Map<number, GameWithCards>,
  ): void {
    const blocks = html.split(/class="badge_row\b/).slice(1);

    for (const block of blocks) {
      const appidMatch = block.match(/\/gamecards\/(\d+)/);

      if (!appidMatch) {
        continue;
      }

      const appid = Number(appidMatch[1]);
      const dropsMatch = block.match(/(\d+)\s+card drops? remaining/i);
      const playtimeMatch = block.match(/([\d.,]+)\s*hrs on record/i);
      const nameMatch = block.match(
        /badge_title">\s*([\s\S]*?)(?:<span|<\/div)/,
      );

      const game: GameWithCards = {
        appid,
        name: nameMatch ? this.cleanText(nameMatch[1]) : String(appid),
        iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
        playtimeForever: playtimeMatch
          ? Math.round(Number(playtimeMatch[1].replace(/,/g, '')) * 60)
          : 0,
        cardsRemaining: dropsMatch ? Number(dropsMatch[1]) : 0,
      };

      const existing = games.get(appid);

      if (
        !existing ||
        (game.cardsRemaining ?? 0) > (existing.cardsRemaining ?? 0)
      ) {
        games.set(appid, game);
      }
    }
  }

  private cleanText(value: string): string {
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cardsKey(accountName: string): string {
    return buildCacheKey('cards', accountName);
  }
}
