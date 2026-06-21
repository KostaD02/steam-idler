import { TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';

import {
  LocalStorageService,
  ThemeService,
} from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';
import { LoggerService } from '@steam-idler/client/infra/util';

import { User } from '@steam-idler/server/auth/types';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';

const USER = { _id: '1', email: 'a@b.c', displayName: 'A' } as unknown as User;

class StorageStub {
  private store = new Map<string, unknown>();
  getItem = jest.fn((key: string) => this.store.get(key) ?? null);
  setItem = jest.fn((key: string, value: unknown) => {
    this.store.set(key, value);
  });
  removeItem = jest.fn((key: string) => {
    this.store.delete(key);
  });
}

const buildAuthApiStub = () => ({
  getCurrentUser: jest.fn().mockReturnValue(of(USER)),
  signIn: jest.fn().mockReturnValue(of({})),
  signUp: jest.fn().mockReturnValue(of({})),
  signOut: jest.fn().mockReturnValue(of({ success: true })),
  refresh: jest.fn().mockReturnValue(of({})),
  updateUser: jest.fn().mockReturnValue(of(USER)),
  deleteUser: jest.fn().mockReturnValue(of({ success: true })),
  changePassword: jest.fn().mockReturnValue(of({})),
});

type AuthApiStub = ReturnType<typeof buildAuthApiStub>;

const setup = () => {
  const storage = new StorageStub();
  const api = buildAuthApiStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: LocalStorageService, useValue: storage },
      { provide: AuthApiService, useValue: api },
      {
        provide: LoggerService,
        useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
      },
      { provide: ThemeService, useValue: { selectedTheme: () => 'dark' } },
    ],
  });
  const service = TestBed.inject(AuthService);
  return { service, storage, api: api as AuthApiStub };
};

describe('AuthService', () => {
  it('starts with no user and isAuthenticated=false', () => {
    const { service } = setup();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('loadCurrentUser', () => {
    it('short-circuits to null when the HasSession marker is absent', () => {
      const { service, api } = setup();
      let result: User | null | undefined;
      service.loadCurrentUser().subscribe((u) => (result = u));
      expect(result).toBeNull();
      expect(api.getCurrentUser).not.toHaveBeenCalled();
    });

    it('calls the API and sets user when the marker is present', () => {
      const { service, storage, api } = setup();
      storage.setItem(StorageKeysEnum.HasSession, true);

      let result: User | null | undefined;
      service.loadCurrentUser().subscribe((u) => (result = u));

      expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toBe(USER);
      expect(service.user()).toBe(USER);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('returns null and leaves user null on API failure', () => {
      const { service, storage, api } = setup();
      storage.setItem(StorageKeysEnum.HasSession, true);
      api.getCurrentUser.mockReturnValueOnce(throwError(() => new Error('x')));

      let result: User | null | undefined;
      service.loadCurrentUser().subscribe((u) => (result = u));

      expect(result).toBeNull();
      expect(service.user()).toBeNull();
    });
  });

  describe('signIn', () => {
    it('sets the user signal and the HasSession marker', () => {
      const { service, storage, api } = setup();

      service.signIn({ email: 'a@b.c', password: 'pw' }).subscribe();

      expect(api.signIn).toHaveBeenCalledTimes(1);
      expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(service.user()).toBe(USER);
      expect(storage.setItem).toHaveBeenCalledWith(
        StorageKeysEnum.HasSession,
        true,
      );
    });
  });

  describe('clearUser', () => {
    it('clears the user signal and removes the marker', () => {
      const { service, storage } = setup();
      storage.setItem(StorageKeysEnum.HasSession, true);

      service.clearUser();

      expect(service.user()).toBeNull();
      expect(storage.removeItem).toHaveBeenCalledWith(
        StorageKeysEnum.HasSession,
      );
    });
  });

  describe('signOut', () => {
    it('clears the user on successful sign-out', () => {
      const { service, api } = setup();
      // pre-populate via signIn
      service.signIn({ email: 'a@b.c', password: 'pw' }).subscribe();
      expect(service.user()).toBe(USER);

      service.signOut().subscribe();

      expect(api.signOut).toHaveBeenCalled();
      expect(service.user()).toBeNull();
    });

    it('clears the user even when the server returns an error (finalize)', () => {
      const { service, api } = setup();
      service.signIn({ email: 'a@b.c', password: 'pw' }).subscribe();
      api.signOut.mockReturnValueOnce(throwError(() => new Error('server')));

      service.signOut().subscribe({ error: () => undefined });

      expect(service.user()).toBeNull();
    });
  });

  describe('cross-tab storage events', () => {
    it('clears the user when HasSession is removed in another tab', () => {
      const { service } = setup();
      service.signIn({ email: 'a@b.c', password: 'pw' }).subscribe();
      expect(service.user()).toBe(USER);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: StorageKeysEnum.HasSession,
          newValue: null,
        }),
      );

      expect(service.user()).toBeNull();
    });

    it('hydrates the user when HasSession is added in another tab', () => {
      const { service, storage, api } = setup();
      // simulate other tab having set the marker in this tab's storage
      storage.setItem(StorageKeysEnum.HasSession, true);
      api.getCurrentUser.mockClear();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: StorageKeysEnum.HasSession,
          newValue: JSON.stringify(true),
        }),
      );

      expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(service.user()).toBe(USER);
    });

    it('ignores storage events for other keys', () => {
      const { service } = setup();
      service.signIn({ email: 'a@b.c', password: 'pw' }).subscribe();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'something-else',
          newValue: null,
        }),
      );

      expect(service.user()).toBe(USER);
    });
  });
});
