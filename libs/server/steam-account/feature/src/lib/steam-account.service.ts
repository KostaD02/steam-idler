import { Injectable, MessageEvent } from '@nestjs/common';

import { Observable } from 'rxjs';

import { ExceptionService } from '@steam-idler/server/infra/services';
import {
  ExceptionStatusKey,
  ExceptionStatusKeys,
  MongoId,
} from '@steam-idler/server/infra/types';

import {
  GameWithCards,
  OwnedGame,
} from '@steam-idler/server/steam-account/types';

import {
  GamesToIdleDto,
  SteamSignInDto,
  UpdateAutoReplyDto,
  UpdateDisplayedGameNameDto,
  UpdatePersonaDto,
} from './dto';
import { SteamCardsService } from './services/steam-cards.service';
import { SteamQrService } from './services/steam-qr.service';
import { SteamUserService } from './services/steam-user.service';

@Injectable()
export class SteamAccountService {
  constructor(
    private readonly steamUserService: SteamUserService,
    private readonly steamCardsService: SteamCardsService,
    private readonly steamQrService: SteamQrService,
    private readonly exceptionService: ExceptionService,
  ) {}

  streamQrLogin(userId: MongoId, theme?: string): Observable<MessageEvent> {
    return this.steamQrService.createLoginStream(userId, theme);
  }

  async getSteamAccounts(userId: MongoId) {
    return this.steamUserService.getByUserId(userId);
  }

  async addSteamAccount(steamSignInDto: SteamSignInDto, userId: MongoId) {
    try {
      return await this.steamUserService.addSteamAccount(
        steamSignInDto,
        userId,
      );
    } catch (err) {
      let status: ExceptionStatusKey = ExceptionStatusKeys.EnhanceYourCalm;
      let message = '';
      let errorKeys: string[] = [];

      if (err instanceof Error) {
        this.exceptionService.throw(
          ExceptionStatusKeys.BadRequest,
          'CHECK ME ON WHAT IT HAPPENED',
          ['CHECK ME ON WHAT IT HAPPENED'],
        );
      } else {
        const error = err as {
          status: ExceptionStatusKey;
          message: string;
          errorKeys: string[];
        };
        status = error.status;
        message = error.message;
        errorKeys = error.errorKeys;
      }

      this.exceptionService.throw(status, message, errorKeys);
    }
  }

  removeSteamAccount(name: string) {
    return this.steamUserService.removeSteamAccount(name);
  }

  idleGames(accountName: string) {
    return this.steamUserService.idleGames(accountName, true);
  }

  stopIdling(accountName: string) {
    return this.steamUserService.stopIdling(accountName);
  }

  updateIdlingGames(name: string, dto: GamesToIdleDto) {
    return this.steamUserService.updateIdlingGames(name, dto);
  }

  updatePersona(name: string, dto: UpdatePersonaDto) {
    return this.steamUserService.updatePersona(name, dto.personaStatus);
  }

  updateDisplayedGameName(name: string, dto: UpdateDisplayedGameNameDto) {
    return this.steamUserService.updateDisplayedGameName(
      name,
      dto.displayedGameName,
    );
  }

  startAutoReply(name: string) {
    return this.steamUserService.setAutoReplyEnabled(name, true);
  }

  stopAutoReply(name: string) {
    return this.steamUserService.setAutoReplyEnabled(name, false);
  }

  updateAutoReply(name: string, dto: UpdateAutoReplyDto) {
    return this.steamUserService.updateAutoReply(name, dto);
  }

  async getCards(name: string): Promise<GameWithCards[]> {
    const [cards, ownedApps] = await Promise.all([
      this.steamCardsService.getCards(name),
      this.steamUserService.getOwnedApps(name),
    ]);

    return this.mergeLibrary(cards, ownedApps);
  }

  private mergeLibrary(
    cards: GameWithCards[],
    ownedApps: OwnedGame[],
  ): GameWithCards[] {
    const byAppid = new Map<number, GameWithCards>();

    for (const owned of ownedApps) {
      byAppid.set(owned.appid, {
        appid: owned.appid,
        name: owned.name,
        iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${owned.appid}/header.jpg`,
        playtimeForever: owned.playtimeForever,
        cardsRemaining: null,
      });
    }

    for (const card of cards) {
      const existing = byAppid.get(card.appid);

      if (existing) {
        existing.cardsRemaining = card.cardsRemaining;
        continue;
      }

      byAppid.set(card.appid, card);
    }

    return [...byAppid.values()];
  }
}
