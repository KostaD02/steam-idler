import { HttpException } from '@nestjs/common';

jest.mock('steam-user', () => {
  class MockSteamUser {
    steamID: unknown = null;
    chat = { on: jest.fn(), sendFriendMessage: jest.fn() };
    on = jest.fn();
    once = jest.fn();
    removeAllListeners = jest.fn();
    logOn = jest.fn();
    logOff = jest.fn();
    gamesPlayed = jest.fn();
    setPersona = jest.fn();
    getUserOwnedApps = jest.fn();
    getPersonas = jest.fn();
  }

  return {
    __esModule: true,
    default: Object.assign(MockSteamUser, {
      EResult: { LogonSessionReplaced: 34 },
      EPersonaState: { Online: 1, Offline: 0 },
    }),
  };
});

import { SteamUserService } from './steam-user.service';

const buildAccountDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => 'account-id' },
  userId: 'user-id',
  accountName: 'tester',
  displayedGameName: '',
  idleSettings: {
    idleEnabled: false,
    personaStatus: 1,
    idleGameIds: [] as number[],
    autoReply: { enabled: false, template: '', whileIdling: false },
  },
  profile: { name: '', avatarUrl: '' },
  credentials: { id: '', cookies: [], refreshToken: '' },
  save: jest.fn().mockResolvedValue(undefined),
  toObject: jest.fn().mockReturnValue({ accountName: 'tester' }),
  ...overrides,
});

const liveSession = (steamID: unknown = { getSteamID64: () => '123' }) => ({
  steamID,
  setPersona: jest.fn(),
  logOff: jest.fn(),
  removeAllListeners: jest.fn(),
  gamesPlayed: jest.fn(),
  getUserOwnedApps: jest.fn(),
});

const setup = () => {
  const steamAccountRepository = {
    getAll: jest.fn().mockResolvedValue([]),
    getByUserId: jest.fn(),
    getByName: jest.fn(),
    existsByName: jest.fn(),
    create: jest.fn(),
    updateCredentials: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
    evictUserAccounts: jest.fn().mockResolvedValue(undefined),
    deleteByAccountName: jest.fn().mockResolvedValue({ success: true }),
  };
  const authRepository = {
    pushSteamAccount: jest.fn().mockResolvedValue(undefined),
    pullSteamAccount: jest.fn().mockResolvedValue(undefined),
  };
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 400);
    }),
  };
  const encryptionService = {
    encrypt: jest.fn((value: string) => value),
    encryptList: jest.fn((values: string[]) => values),
    decrypt: jest.fn((value: string) => value),
  };
  const steamCardsService = { refreshSilently: jest.fn() };

  const service = new SteamUserService(
    steamAccountRepository as never,
    authRepository as never,
    exceptionService as never,
    encryptionService as never,
    steamCardsService as never,
  );

  return {
    service,
    steamAccountRepository,
    authRepository,
    exceptionService,
    encryptionService,
    steamCardsService,
  };
};

const seedSession = (
  service: SteamUserService,
  accountName: string,
  session: ReturnType<typeof liveSession>,
) => {
  (service as unknown as { usersMap: Map<string, unknown> }).usersMap.set(
    accountName,
    session,
  );
};

describe('SteamUserService', () => {
  it('delegates getByUserId to the repository', () => {
    const { service, steamAccountRepository } = setup();
    steamAccountRepository.getByUserId.mockReturnValue('accounts');

    expect(service.getByUserId('user-id' as never)).toBe('accounts');
    expect(steamAccountRepository.getByUserId).toHaveBeenCalledWith('user-id');
  });

  describe('getOwnedApps', () => {
    it('returns an empty list when there is no live session', async () => {
      const { service } = setup();

      await expect(service.getOwnedApps('tester')).resolves.toEqual([]);
    });

    it('maps the owned apps from the live session', async () => {
      const { service } = setup();
      const session = liveSession();
      session.getUserOwnedApps.mockResolvedValue({
        apps: [{ appid: 10, name: 'Game', playtime_forever: 42 }],
      });
      seedSession(service, 'tester', session);

      await expect(service.getOwnedApps('tester')).resolves.toEqual([
        { appid: 10, name: 'Game', playtimeForever: 42 },
      ]);
    });

    it('returns an empty list when the session fetch fails', async () => {
      const { service } = setup();
      const session = liveSession();
      session.getUserOwnedApps.mockRejectedValue(new Error('offline'));
      seedSession(service, 'tester', session);

      await expect(service.getOwnedApps('tester')).resolves.toEqual([]);
    });
  });

  describe('removeSteamAccount', () => {
    it('throws when the account has no live session', async () => {
      const { service } = setup();

      await expect(service.removeSteamAccount('unknown')).rejects.toThrow(
        HttpException,
      );
    });

    it('logs the account off and deletes it', async () => {
      const { service, steamAccountRepository, authRepository } = setup();
      const session = liveSession();
      seedSession(service, 'tester', session);
      steamAccountRepository.getByName.mockResolvedValue(
        buildAccountDoc({ _id: { toString: () => 'account-id' } }),
      );

      const result = await service.removeSteamAccount('tester');

      expect(session.logOff).toHaveBeenCalled();
      expect(session.removeAllListeners).toHaveBeenCalled();
      expect(authRepository.pullSteamAccount).toHaveBeenCalled();
      expect(steamAccountRepository.deleteByAccountName).toHaveBeenCalledWith(
        'tester',
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('updatePersona', () => {
    it('persists the persona and pushes it to the live session', async () => {
      const { service, steamAccountRepository } = setup();
      const account = buildAccountDoc();
      steamAccountRepository.getByName.mockResolvedValue(account);
      const session = liveSession();
      seedSession(service, 'tester', session);

      await service.updatePersona('tester', 2 as never);

      expect(account.idleSettings.personaStatus).toBe(2);
      expect(account.save).toHaveBeenCalled();
      expect(steamAccountRepository.evictUserAccounts).toHaveBeenCalled();
      expect(session.setPersona).toHaveBeenCalledWith(2);
    });

    it('throws when the account does not exist', async () => {
      const { service, steamAccountRepository } = setup();
      steamAccountRepository.getByName.mockResolvedValue(null);

      await expect(service.updatePersona('tester', 2 as never)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('stopIdling', () => {
    it('disables idling and clears the played games', async () => {
      const { service, steamAccountRepository } = setup();
      const account = buildAccountDoc({
        idleSettings: {
          idleEnabled: true,
          personaStatus: 1,
          idleGameIds: [10],
          autoReply: { enabled: false, template: '', whileIdling: false },
        },
      });
      steamAccountRepository.getByName.mockResolvedValue(account);
      const session = liveSession();
      seedSession(service, 'tester', session);

      await service.stopIdling('tester');

      expect(account.idleSettings.idleEnabled).toBe(false);
      expect(session.gamesPlayed).toHaveBeenCalledWith([], true);
    });
  });
});
