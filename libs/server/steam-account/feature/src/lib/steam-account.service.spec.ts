import { HttpException } from '@nestjs/common';

import { of } from 'rxjs';

import { SteamAccountService } from './steam-account.service';

const setup = () => {
  const steamUserService = {
    getByUserId: jest.fn(),
    addSteamAccount: jest.fn(),
    removeSteamAccount: jest.fn(),
    idleGames: jest.fn(),
    stopIdling: jest.fn(),
    updateIdlingGames: jest.fn(),
    updatePersona: jest.fn(),
    updateDisplayedGameName: jest.fn(),
    setAutoReplyEnabled: jest.fn(),
    updateAutoReply: jest.fn(),
    getOwnedApps: jest.fn().mockResolvedValue([]),
  };
  const steamCardsService = {
    getCards: jest.fn().mockResolvedValue([]),
  };
  const steamQrService = {
    createLoginStream: jest.fn(),
  };
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 400);
    }),
  };

  const service = new SteamAccountService(
    steamUserService as never,
    steamCardsService as never,
    steamQrService as never,
    exceptionService as never,
  );

  return {
    service,
    steamUserService,
    steamCardsService,
    steamQrService,
    exceptionService,
  };
};

describe('SteamAccountService', () => {
  it('delegates streamQrLogin to the qr service', () => {
    const { service, steamQrService } = setup();
    const stream = of({ type: 'qr' });
    steamQrService.createLoginStream.mockReturnValue(stream);

    expect(service.streamQrLogin('user-id' as never, 'dark')).toBe(stream);
    expect(steamQrService.createLoginStream).toHaveBeenCalledWith(
      'user-id',
      'dark',
    );
  });

  it('delegates getSteamAccounts to the user service', async () => {
    const { service, steamUserService } = setup();
    steamUserService.getByUserId.mockResolvedValue(['account']);

    await expect(service.getSteamAccounts('user-id' as never)).resolves.toEqual(
      ['account'],
    );
    expect(steamUserService.getByUserId).toHaveBeenCalledWith('user-id');
  });

  describe('addSteamAccount', () => {
    it('returns the account created by the user service', async () => {
      const { service, steamUserService } = setup();
      steamUserService.addSteamAccount.mockResolvedValue({ accountName: 'a' });

      await expect(
        service.addSteamAccount({} as never, 'user-id' as never),
      ).resolves.toEqual({ accountName: 'a' });
    });

    it('rethrows through the exception service when a plain Error is raised', async () => {
      const { service, steamUserService, exceptionService } = setup();
      steamUserService.addSteamAccount.mockRejectedValue(new Error('boom'));

      await expect(
        service.addSteamAccount({} as never, 'user-id' as never),
      ).rejects.toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalled();
    });

    it('forwards a structured steam error to the exception service', async () => {
      const { service, steamUserService, exceptionService } = setup();
      steamUserService.addSteamAccount.mockRejectedValue({
        status: 'errors.bad_request',
        message: 'invalid credentials',
        errorKeys: ['errors.steam_account.invalid_credentials'],
      });

      await expect(
        service.addSteamAccount({} as never, 'user-id' as never),
      ).rejects.toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'invalid credentials',
        ['errors.steam_account.invalid_credentials'],
      );
    });
  });

  it('delegates removeSteamAccount to the user service', () => {
    const { service, steamUserService } = setup();
    steamUserService.removeSteamAccount.mockReturnValue('removed');

    expect(service.removeSteamAccount('tester')).toBe('removed');
    expect(steamUserService.removeSteamAccount).toHaveBeenCalledWith('tester');
  });

  it('starts idling with the force flag set', () => {
    const { service, steamUserService } = setup();

    service.idleGames('tester');

    expect(steamUserService.idleGames).toHaveBeenCalledWith('tester', true);
  });

  it('delegates stopIdling to the user service', () => {
    const { service, steamUserService } = setup();

    service.stopIdling('tester');

    expect(steamUserService.stopIdling).toHaveBeenCalledWith('tester');
  });

  it('delegates updateIdlingGames to the user service', () => {
    const { service, steamUserService } = setup();
    const dto = { gamesIds: [1, 2] };

    service.updateIdlingGames('tester', dto as never);

    expect(steamUserService.updateIdlingGames).toHaveBeenCalledWith(
      'tester',
      dto,
    );
  });

  it('unwraps the persona status from the dto', () => {
    const { service, steamUserService } = setup();

    service.updatePersona('tester', { personaStatus: 1 } as never);

    expect(steamUserService.updatePersona).toHaveBeenCalledWith('tester', 1);
  });

  it('unwraps the displayed game name from the dto', () => {
    const { service, steamUserService } = setup();

    service.updateDisplayedGameName('tester', {
      displayedGameName: 'Custom',
    } as never);

    expect(steamUserService.updateDisplayedGameName).toHaveBeenCalledWith(
      'tester',
      'Custom',
    );
  });

  it('enables auto-reply when starting', () => {
    const { service, steamUserService } = setup();

    service.startAutoReply('tester');

    expect(steamUserService.setAutoReplyEnabled).toHaveBeenCalledWith(
      'tester',
      true,
    );
  });

  it('disables auto-reply when stopping', () => {
    const { service, steamUserService } = setup();

    service.stopAutoReply('tester');

    expect(steamUserService.setAutoReplyEnabled).toHaveBeenCalledWith(
      'tester',
      false,
    );
  });

  it('delegates updateAutoReply to the user service', () => {
    const { service, steamUserService } = setup();
    const dto = { template: 'hi', whileIdling: true };

    service.updateAutoReply('tester', dto as never);

    expect(steamUserService.updateAutoReply).toHaveBeenCalledWith(
      'tester',
      dto,
    );
  });

  describe('getCards', () => {
    it('maps owned games and overlays cards remaining for matching apps', async () => {
      const { service, steamCardsService, steamUserService } = setup();
      steamUserService.getOwnedApps.mockResolvedValue([
        { appid: 1, name: 'Owned', playtimeForever: 60 },
      ]);
      steamCardsService.getCards.mockResolvedValue([
        {
          appid: 1,
          name: 'Owned',
          iconUrl: 'icon',
          playtimeForever: 60,
          cardsRemaining: 3,
        },
      ]);

      const result = await service.getCards('tester');

      expect(result).toEqual([
        {
          appid: 1,
          name: 'Owned',
          iconUrl:
            'https://cdn.cloudflare.steamstatic.com/steam/apps/1/header.jpg',
          playtimeForever: 60,
          cardsRemaining: 3,
        },
      ]);
    });

    it('includes card-bearing games that are not in the owned list', async () => {
      const { service, steamCardsService, steamUserService } = setup();
      steamUserService.getOwnedApps.mockResolvedValue([]);
      const card = {
        appid: 9,
        name: 'Cards Only',
        iconUrl: 'icon',
        playtimeForever: 0,
        cardsRemaining: 1,
      };
      steamCardsService.getCards.mockResolvedValue([card]);

      const result = await service.getCards('tester');

      expect(result).toEqual([card]);
    });

    it('leaves cardsRemaining null for owned games without cards', async () => {
      const { service, steamCardsService, steamUserService } = setup();
      steamUserService.getOwnedApps.mockResolvedValue([
        { appid: 2, name: 'No Cards', playtimeForever: 10 },
      ]);
      steamCardsService.getCards.mockResolvedValue([]);

      const result = await service.getCards('tester');

      expect(result[0].cardsRemaining).toBeNull();
    });
  });
});
