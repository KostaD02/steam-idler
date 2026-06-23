import { of } from 'rxjs';

import { User } from '@steam-idler/server/auth/types';

import { SteamAccountController } from './steam-account.controller';

const USER = { _id: 'user-1' } as unknown as User;

const setup = () => {
  const steamAccountService = {
    getSteamAccounts: jest.fn(),
    getCards: jest.fn(),
    addSteamAccount: jest.fn(),
    streamQrLogin: jest.fn(),
    removeSteamAccount: jest.fn(),
    idleGames: jest.fn(),
    stopIdling: jest.fn(),
    updateIdlingGames: jest.fn(),
    updatePersona: jest.fn(),
    updateDisplayedGameName: jest.fn(),
    startAutoReply: jest.fn(),
    stopAutoReply: jest.fn(),
    updateAutoReply: jest.fn(),
  };

  const controller = new SteamAccountController(steamAccountService as never);

  return { controller, steamAccountService };
};

describe('SteamAccountController', () => {
  it('lists the accounts for the current user', () => {
    const { controller, steamAccountService } = setup();
    steamAccountService.getSteamAccounts.mockReturnValue('accounts');

    expect(controller.getSteamAccounts(USER)).toBe('accounts');
    expect(steamAccountService.getSteamAccounts).toHaveBeenCalledWith('user-1');
  });

  it('reads cards for the named account', () => {
    const { controller, steamAccountService } = setup();
    steamAccountService.getCards.mockReturnValue('cards');

    expect(controller.getCards('tester')).toBe('cards');
    expect(steamAccountService.getCards).toHaveBeenCalledWith('tester');
  });

  it('adds a steam account for the current user', () => {
    const { controller, steamAccountService } = setup();
    const dto = { login: 'a', password: 'b' };
    steamAccountService.addSteamAccount.mockReturnValue('created');

    expect(controller.addSteamAccount(dto as never, USER)).toBe('created');
    expect(steamAccountService.addSteamAccount).toHaveBeenCalledWith(
      dto,
      'user-1',
    );
  });

  it('opens the qr login stream with the requested theme', () => {
    const { controller, steamAccountService } = setup();
    const stream = of({ type: 'qr' });
    steamAccountService.streamQrLogin.mockReturnValue(stream);

    expect(controller.qrStream(USER, 'dark')).toBe(stream);
    expect(steamAccountService.streamQrLogin).toHaveBeenCalledWith(
      'user-1',
      'dark',
    );
  });

  it('removes the named account', () => {
    const { controller, steamAccountService } = setup();
    steamAccountService.removeSteamAccount.mockReturnValue('removed');

    expect(controller.removeSteamAccount('tester')).toBe('removed');
    expect(steamAccountService.removeSteamAccount).toHaveBeenCalledWith(
      'tester',
    );
  });

  it('starts idling for the named account', () => {
    const { controller, steamAccountService } = setup();

    controller.startIdling('tester');

    expect(steamAccountService.idleGames).toHaveBeenCalledWith('tester');
  });

  it('stops idling for the named account', () => {
    const { controller, steamAccountService } = setup();

    controller.stopIdling('tester');

    expect(steamAccountService.stopIdling).toHaveBeenCalledWith('tester');
  });

  it('updates the idling games for the named account', () => {
    const { controller, steamAccountService } = setup();
    const dto = { gamesIds: [1] };

    controller.updateIdlingGames('tester', dto as never);

    expect(steamAccountService.updateIdlingGames).toHaveBeenCalledWith(
      'tester',
      dto,
    );
  });

  it('updates the persona for the named account', () => {
    const { controller, steamAccountService } = setup();
    const dto = { personaStatus: 1 };

    controller.updatePersona('tester', dto as never);

    expect(steamAccountService.updatePersona).toHaveBeenCalledWith(
      'tester',
      dto,
    );
  });

  it('updates the displayed game name for the named account', () => {
    const { controller, steamAccountService } = setup();
    const dto = { displayedGameName: 'Custom' };

    controller.updateDisplayedGameName('tester', dto as never);

    expect(steamAccountService.updateDisplayedGameName).toHaveBeenCalledWith(
      'tester',
      dto,
    );
  });

  it('enables auto-reply for the named account', () => {
    const { controller, steamAccountService } = setup();

    controller.startAutoReply('tester');

    expect(steamAccountService.startAutoReply).toHaveBeenCalledWith('tester');
  });

  it('disables auto-reply for the named account', () => {
    const { controller, steamAccountService } = setup();

    controller.stopAutoReply('tester');

    expect(steamAccountService.stopAutoReply).toHaveBeenCalledWith('tester');
  });

  it('updates auto-reply settings for the named account', () => {
    const { controller, steamAccountService } = setup();
    const dto = { template: 'hi', whileIdling: false };

    controller.updateAutoReply('tester', dto as never);

    expect(steamAccountService.updateAutoReply).toHaveBeenCalledWith(
      'tester',
      dto,
    );
  });
});
