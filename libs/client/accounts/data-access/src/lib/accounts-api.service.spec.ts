import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { ApiService } from '@steam-idler/client/infra/data-access';
import { ThemeEnum } from '@steam-idler/client/infra/types';

import {
  QrLoginEventType,
  SteamAccountSummary,
} from '@steam-idler/server/steam-account/types';

import { AccountsApiService } from './accounts-api.service';

const ACCOUNT = { name: 'bob' } as unknown as SteamAccountSummary;

const buildApiStub = () => ({
  get: jest.fn().mockReturnValue(of(ACCOUNT)),
  post: jest.fn().mockReturnValue(of(ACCOUNT)),
  patch: jest.fn().mockReturnValue(of(ACCOUNT)),
  delete: jest.fn().mockReturnValue(of({ success: true })),
  stream: jest.fn().mockReturnValue(of({ event: 'qr', data: {} })),
});

type ApiStub = ReturnType<typeof buildApiStub>;

const setup = () => {
  const api = buildApiStub();
  TestBed.configureTestingModule({
    providers: [{ provide: ApiService, useValue: api }],
  });
  const service = TestBed.inject(AccountsApiService);

  return { service, api: api as ApiStub };
};

describe('AccountsApiService', () => {
  describe('getSteamAccounts', () => {
    it('gets the steam-account collection', () => {
      const { service, api } = setup();

      let result: unknown;
      service.getSteamAccounts().subscribe((r) => (result = r));

      expect(api.get).toHaveBeenCalledWith('/steam-account');
      expect(result).toBe(ACCOUNT);
    });
  });

  describe('getCards', () => {
    it('encodes the account name into the cards url', () => {
      const { service, api } = setup();

      service.getCards('a b/c').subscribe();

      expect(api.get).toHaveBeenCalledWith('/steam-account/cards/a%20b%2Fc');
    });
  });

  describe('addSteamAccount', () => {
    it('posts the sign-in dto to the collection', () => {
      const { service, api } = setup();
      const dto = { accountName: 'bob', password: 'pw' } as never;

      service.addSteamAccount(dto).subscribe();

      expect(api.post).toHaveBeenCalledWith('/steam-account', dto);
    });
  });

  describe('streamQrLogin', () => {
    it('streams the qr endpoint with the theme and all event names', () => {
      const { service, api } = setup();

      service.streamQrLogin(ThemeEnum.Dark).subscribe();

      expect(api.stream).toHaveBeenCalledWith(
        '/steam-account/qr/stream?theme=dark',
        Object.values(QrLoginEventType),
      );
    });
  });

  describe('startIdling', () => {
    it('posts to the encoded idle start url with an empty body', () => {
      const { service, api } = setup();

      service.startIdling('a b').subscribe();

      expect(api.post).toHaveBeenCalledWith(
        '/steam-account/idle/start/a%20b',
        {},
      );
    });
  });

  describe('stopIdling', () => {
    it('posts to the encoded idle stop url with an empty body', () => {
      const { service, api } = setup();

      service.stopIdling('a b').subscribe();

      expect(api.post).toHaveBeenCalledWith(
        '/steam-account/idle/stop/a%20b',
        {},
      );
    });
  });

  describe('updateIdleGames', () => {
    it('patches the encoded idle games url with the dto', () => {
      const { service, api } = setup();
      const dto = { gamesToIdle: [1, 2] } as never;

      service.updateIdleGames('a b', dto).subscribe();

      expect(api.patch).toHaveBeenCalledWith(
        '/steam-account/idle/games/a%20b',
        dto,
      );
    });
  });

  describe('removeSteamAccount', () => {
    it('deletes the encoded remove url', () => {
      const { service, api } = setup();

      let result: unknown;
      service.removeSteamAccount('a b').subscribe((r) => (result = r));

      expect(api.delete).toHaveBeenCalledWith('/steam-account/remove/a%20b');
      expect(result).toEqual({ success: true });
    });
  });

  describe('updatePersona', () => {
    it('patches the encoded persona url with the dto', () => {
      const { service, api } = setup();
      const dto = { personaName: 'new' } as never;

      service.updatePersona('a b', dto).subscribe();

      expect(api.patch).toHaveBeenCalledWith(
        '/steam-account/persona/a%20b',
        dto,
      );
    });
  });

  describe('updateDisplayedGameName', () => {
    it('patches the encoded displayed-game url with the dto', () => {
      const { service, api } = setup();
      const dto = { displayedGameName: 'CS' } as never;

      service.updateDisplayedGameName('a b', dto).subscribe();

      expect(api.patch).toHaveBeenCalledWith(
        '/steam-account/displayed-game/a%20b',
        dto,
      );
    });
  });

  describe('startAutoReply', () => {
    it('posts to the encoded auto-reply start url with an empty body', () => {
      const { service, api } = setup();

      service.startAutoReply('a b').subscribe();

      expect(api.post).toHaveBeenCalledWith(
        '/steam-account/auto-reply/start/a%20b',
        {},
      );
    });
  });

  describe('stopAutoReply', () => {
    it('posts to the encoded auto-reply stop url with an empty body', () => {
      const { service, api } = setup();

      service.stopAutoReply('a b').subscribe();

      expect(api.post).toHaveBeenCalledWith(
        '/steam-account/auto-reply/stop/a%20b',
        {},
      );
    });
  });

  describe('updateAutoReply', () => {
    it('patches the encoded auto-reply url with the dto', () => {
      const { service, api } = setup();
      const dto = { message: 'away' } as never;

      service.updateAutoReply('a b', dto).subscribe();

      expect(api.patch).toHaveBeenCalledWith(
        '/steam-account/auto-reply/a%20b',
        dto,
      );
    });
  });
});
