import { TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';

import { ThemeService } from '@steam-idler/client/infra/core';
import { ThemeEnum } from '@steam-idler/client/infra/types';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { SteamAccountSummary } from '@steam-idler/server/steam-account/types';

import { AccountsApiService } from './accounts-api.service';
import { AccountsService } from './accounts.service';

const ACCOUNT = { name: 'bob' } as unknown as SteamAccountSummary;

const buildApiStub = () => ({
  getSteamAccounts: jest.fn().mockReturnValue(of([ACCOUNT])),
  streamQrLogin: jest.fn().mockReturnValue(of({ event: 'qr', data: {} })),
  getCards: jest.fn().mockReturnValue(of([])),
  addSteamAccount: jest.fn().mockReturnValue(of(ACCOUNT)),
  startIdling: jest.fn().mockReturnValue(of(ACCOUNT)),
  stopIdling: jest.fn().mockReturnValue(of(ACCOUNT)),
  updateIdleGames: jest.fn().mockReturnValue(of(ACCOUNT)),
  removeSteamAccount: jest.fn().mockReturnValue(of({ success: true })),
  updatePersona: jest.fn().mockReturnValue(of(ACCOUNT)),
  updateDisplayedGameName: jest.fn().mockReturnValue(of(ACCOUNT)),
  startAutoReply: jest.fn().mockReturnValue(of(ACCOUNT)),
  stopAutoReply: jest.fn().mockReturnValue(of(ACCOUNT)),
  updateAutoReply: jest.fn().mockReturnValue(of(ACCOUNT)),
});

const buildAuthStub = () => ({
  loadCurrentUser: jest.fn().mockReturnValue(of(null)),
});

const buildThemeStub = () => ({
  selectedTheme: jest.fn().mockReturnValue(ThemeEnum.Light),
});

type ApiStub = ReturnType<typeof buildApiStub>;
type AuthStub = ReturnType<typeof buildAuthStub>;
type ThemeStub = ReturnType<typeof buildThemeStub>;

const setup = () => {
  const api = buildApiStub();
  const auth = buildAuthStub();
  const theme = buildThemeStub();

  TestBed.configureTestingModule({
    providers: [
      { provide: AccountsApiService, useValue: api },
      { provide: AuthService, useValue: auth },
      { provide: ThemeService, useValue: theme },
    ],
  });
  const service = TestBed.inject(AccountsService);

  return {
    service,
    api: api as ApiStub,
    auth: auth as AuthStub,
    theme: theme as ThemeStub,
  };
};

describe('AccountsService', () => {
  describe('getSteamAccounts', () => {
    it('delegates to the api service', () => {
      const { service, api } = setup();

      let result: unknown;
      service.getSteamAccounts().subscribe((r) => (result = r));

      expect(api.getSteamAccounts).toHaveBeenCalledTimes(1);
      expect(result).toEqual([ACCOUNT]);
    });
  });

  describe('streamQrLogin', () => {
    it('forwards the currently selected theme to the api service', () => {
      const { service, api, theme } = setup();

      service.streamQrLogin().subscribe();

      expect(theme.selectedTheme).toHaveBeenCalledTimes(1);
      expect(api.streamQrLogin).toHaveBeenCalledWith(ThemeEnum.Light);
    });
  });

  describe('getCards', () => {
    it('delegates to the api service with the account name', () => {
      const { service, api } = setup();

      service.getCards('bob').subscribe();

      expect(api.getCards).toHaveBeenCalledWith('bob');
    });
  });

  describe('addSteamAccount', () => {
    it('reloads the current user and emits the created account', () => {
      const { service, api, auth } = setup();
      const dto = { accountName: 'bob', password: 'pw' } as never;

      let result: unknown;
      service.addSteamAccount(dto).subscribe((r) => (result = r));

      expect(api.addSteamAccount).toHaveBeenCalledWith(dto);
      expect(auth.loadCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toBe(ACCOUNT);
    });

    it('does not reload the user when the add request fails', () => {
      const { service, api, auth } = setup();
      api.addSteamAccount.mockReturnValueOnce(
        throwError(() => new Error('add failed')),
      );

      let error: unknown;
      service
        .addSteamAccount({} as never)
        .subscribe({ error: (e) => (error = e) });

      expect(error).toEqual(new Error('add failed'));
      expect(auth.loadCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('startIdling', () => {
    it('delegates to the api service with the account name', () => {
      const { service, api } = setup();

      service.startIdling('bob').subscribe();

      expect(api.startIdling).toHaveBeenCalledWith('bob');
    });
  });

  describe('stopIdling', () => {
    it('delegates to the api service with the account name', () => {
      const { service, api } = setup();

      service.stopIdling('bob').subscribe();

      expect(api.stopIdling).toHaveBeenCalledWith('bob');
    });
  });

  describe('updateIdleGames', () => {
    it('delegates to the api service with the name and dto', () => {
      const { service, api } = setup();
      const dto = { gamesToIdle: [1] } as never;

      service.updateIdleGames('bob', dto).subscribe();

      expect(api.updateIdleGames).toHaveBeenCalledWith('bob', dto);
    });
  });

  describe('removeSteamAccount', () => {
    it('reloads the current user and emits the removal result', () => {
      const { service, api, auth } = setup();

      let result: unknown;
      service.removeSteamAccount('bob').subscribe((r) => (result = r));

      expect(api.removeSteamAccount).toHaveBeenCalledWith('bob');
      expect(auth.loadCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('updatePersona', () => {
    it('delegates to the api service with the name and dto', () => {
      const { service, api } = setup();
      const dto = { personaName: 'new' } as never;

      service.updatePersona('bob', dto).subscribe();

      expect(api.updatePersona).toHaveBeenCalledWith('bob', dto);
    });
  });

  describe('updateDisplayedGameName', () => {
    it('delegates to the api service with the name and dto', () => {
      const { service, api } = setup();
      const dto = { displayedGameName: 'CS' } as never;

      service.updateDisplayedGameName('bob', dto).subscribe();

      expect(api.updateDisplayedGameName).toHaveBeenCalledWith('bob', dto);
    });
  });

  describe('startAutoReply', () => {
    it('delegates to the api service with the account name', () => {
      const { service, api } = setup();

      service.startAutoReply('bob').subscribe();

      expect(api.startAutoReply).toHaveBeenCalledWith('bob');
    });
  });

  describe('stopAutoReply', () => {
    it('delegates to the api service with the account name', () => {
      const { service, api } = setup();

      service.stopAutoReply('bob').subscribe();

      expect(api.stopAutoReply).toHaveBeenCalledWith('bob');
    });
  });

  describe('updateAutoReply', () => {
    it('delegates to the api service with the name and dto', () => {
      const { service, api } = setup();
      const dto = { message: 'away' } as never;

      service.updateAutoReply('bob', dto).subscribe();

      expect(api.updateAutoReply).toHaveBeenCalledWith('bob', dto);
    });
  });
});
