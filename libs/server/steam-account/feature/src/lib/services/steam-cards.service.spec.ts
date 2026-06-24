import { HttpException } from '@nestjs/common';

jest.mock('axios');

import axios from 'axios';

import { SteamCardsService } from './steam-cards.service';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const buildAccount = (overrides: Record<string, unknown> = {}) => ({
  accountName: 'tester',
  credentials: { id: '7656', cookies: ['enc-cookie'] },
  idleSettings: { idleEnabled: true },
  ...overrides,
});

const setup = () => {
  const steamAccountRepository = {
    getByName: jest.fn().mockResolvedValue(buildAccount()),
    getAll: jest.fn().mockResolvedValue([]),
  };
  const encryptionService = {
    decryptList: jest.fn((values: string[]) => values.map(() => 'cookie')),
  };
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 400);
    }),
  };
  const cacheService = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
  };

  const service = new SteamCardsService(
    steamAccountRepository as never,
    encryptionService as never,
    exceptionService as never,
    cacheService as never,
  );

  return {
    service,
    steamAccountRepository,
    encryptionService,
    exceptionService,
    cacheService,
  };
};

const badgePage = (rows: string, pagelinks = '') => `
  <html>
    ${pagelinks}
    ${rows}
  </html>
`;

const badgeRow = (
  appid: number,
  name: string,
  drops: number,
  hours: number,
) => `
  <div class="badge_row is_link">
    <a href="/gamecards/${appid}/"></a>
    <div class="badge_title">${name}<span> </span></div>
    <span class="progress_info_bold">${drops} card drops remaining</span>
    <div class="badge_title_stats_playtime">${hours} hrs on record</div>
  </div>
`;

describe('SteamCardsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCards', () => {
    it('refreshes when there is no cached entry', async () => {
      const { service, cacheService } = setup();
      cacheService.get.mockResolvedValue(undefined);
      mockedAxios.get.mockResolvedValue({
        data: badgePage(badgeRow(10, 'Game A', 2, 1.5)),
      });

      const result = await service.getCards('tester');

      expect(result).toEqual([
        {
          appid: 10,
          name: 'Game A',
          iconUrl:
            'https://cdn.cloudflare.steamstatic.com/steam/apps/10/header.jpg',
          playtimeForever: 90,
          cardsRemaining: 2,
        },
      ]);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('returns the cached value without scraping when present and fresh', async () => {
      const { service, cacheService } = setup();
      const cached = [
        {
          appid: 5,
          name: 'Cached',
          iconUrl: 'icon',
          playtimeForever: 0,
          cardsRemaining: 1,
        },
      ];
      cacheService.get.mockResolvedValue(cached);
      (
        service as unknown as { lastRefreshAt: Map<string, number> }
      ).lastRefreshAt.set('tester', Date.now());

      const result = await service.getCards('tester');

      expect(result).toBe(cached);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('serves the cached value but triggers a silent refresh when stale', async () => {
      const { service, cacheService } = setup();
      const cached = [
        {
          appid: 5,
          name: 'Cached',
          iconUrl: 'icon',
          playtimeForever: 0,
          cardsRemaining: 1,
        },
      ];
      cacheService.get.mockResolvedValue(cached);
      mockedAxios.get.mockResolvedValue({
        data: badgePage(badgeRow(10, 'Game', 1, 0)),
      });

      const result = await service.getCards('tester');
      await flush();

      expect(result).toBe(cached);
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  describe('refreshCards', () => {
    it('throws when the account does not exist', async () => {
      const { service, steamAccountRepository } = setup();
      steamAccountRepository.getByName.mockResolvedValue(null);

      await expect(service.refreshCards('tester')).rejects.toThrow(
        HttpException,
      );
    });

    it('throws when the steam session is not ready', async () => {
      const { service, steamAccountRepository } = setup();
      steamAccountRepository.getByName.mockResolvedValue(
        buildAccount({ credentials: { id: '', cookies: [] } }),
      );

      await expect(service.refreshCards('tester')).rejects.toThrow(
        HttpException,
      );
    });

    it('throws when the badges page reports a signed-out session', async () => {
      const { service } = setup();
      mockedAxios.get.mockResolvedValue({
        data: badgePage('g_steamID = false'),
      });

      await expect(service.refreshCards('tester')).rejects.toThrow(
        HttpException,
      );
    });

    it('throws when fetching the badges page fails', async () => {
      const { service } = setup();
      mockedAxios.get.mockRejectedValue(new Error('network'));

      await expect(service.refreshCards('tester')).rejects.toThrow(
        HttpException,
      );
    });

    it('sorts games by cards remaining then name', async () => {
      const { service } = setup();
      mockedAxios.get.mockResolvedValue({
        data: badgePage(
          badgeRow(1, 'Alpha', 1, 0) +
            badgeRow(2, 'Beta', 3, 0) +
            badgeRow(3, 'Gamma', 3, 0),
        ),
      });

      const result = await service.refreshCards('tester');

      expect(result.map((game) => game.appid)).toEqual([2, 3, 1]);
    });

    it('walks every badge page up to the parsed page count', async () => {
      const { service } = setup();
      const pagelinks =
        '<a class="pagelink" href="?p=2">2</a><a class="pagelink" href="?p=3">3</a>';
      mockedAxios.get
        .mockResolvedValueOnce({
          data: badgePage(badgeRow(1, 'Page1', 1, 0), pagelinks),
        })
        .mockResolvedValueOnce({ data: badgePage(badgeRow(2, 'Page2', 1, 0)) })
        .mockResolvedValueOnce({ data: badgePage(badgeRow(3, 'Page3', 1, 0)) });

      const result = await service.refreshCards('tester');

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result.map((game) => game.appid).sort()).toEqual([1, 2, 3]);
    });

    it('shares a single in-flight refresh between concurrent callers', async () => {
      const { service } = setup();
      mockedAxios.get.mockResolvedValue({
        data: badgePage(badgeRow(10, 'Game', 1, 0)),
      });

      const first = service.refreshCards('tester');
      const second = service.refreshCards('tester');

      expect(first).toBe(second);

      await Promise.all([first, second]);
    });
  });

  describe('refreshSilently', () => {
    it('skips refreshing when the last refresh was too recent', async () => {
      const { service, steamAccountRepository } = setup();
      mockedAxios.get.mockResolvedValue({
        data: badgePage(badgeRow(10, 'Game', 1, 0)),
      });

      await service.refreshCards('tester');
      steamAccountRepository.getByName.mockClear();

      await service.refreshSilently('tester');

      expect(steamAccountRepository.getByName).not.toHaveBeenCalled();
    });

    it('swallows errors raised by the underlying refresh', async () => {
      const { service, steamAccountRepository } = setup();
      steamAccountRepository.getByName.mockResolvedValue(null);

      await expect(service.refreshSilently('tester')).resolves.toBeUndefined();
    });
  });

  describe('lifecycle hooks', () => {
    it('clears the refresh timer on destroy', () => {
      const { service } = setup();
      service.onModuleInit();

      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
