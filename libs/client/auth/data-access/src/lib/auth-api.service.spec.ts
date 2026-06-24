import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { ApiService } from '@steam-idler/client/infra/data-access';

import {
  ChangePasswordDto,
  SignInDto,
  SignUpDto,
  Tokens,
  UpdateUserDto,
  UpdateUserSettingsDto,
  User,
} from '@steam-idler/server/auth/types';

import { AuthApiService } from './auth-api.service';

const USER = { _id: '1', email: 'a@b.c', displayName: 'A' } as unknown as User;
const TOKENS = {
  access_token: 'a',
  refresh_token: 'r',
} as Tokens;

const buildApiStub = () => ({
  get: jest.fn().mockReturnValue(of(USER)),
  post: jest.fn().mockReturnValue(of(TOKENS)),
  patch: jest.fn().mockReturnValue(of(USER)),
  delete: jest.fn().mockReturnValue(of({ success: true })),
});

type ApiStub = ReturnType<typeof buildApiStub>;

const setup = () => {
  const api = buildApiStub();

  TestBed.configureTestingModule({
    providers: [{ provide: ApiService, useValue: api }],
  });

  const service = TestBed.inject(AuthApiService);

  return { service, api: api as ApiStub };
};

describe('AuthApiService', () => {
  describe('getCurrentUser', () => {
    it('gets the current user from /auth', () => {
      const { service, api } = setup();

      let result: User | undefined;
      service.getCurrentUser().subscribe((u) => (result = u));

      expect(api.get).toHaveBeenCalledWith('/auth');
      expect(result).toBe(USER);
    });
  });

  describe('signUp', () => {
    it('posts the sign-up payload to /auth/sign-up', () => {
      const { service, api } = setup();
      const dto: SignUpDto = {
        email: 'a@b.c',
        password: 'pw',
        displayName: 'A',
      };

      let result: Tokens | undefined;
      service.signUp(dto).subscribe((t) => (result = t));

      expect(api.post).toHaveBeenCalledWith('/auth/sign-up', dto);
      expect(result).toBe(TOKENS);
    });
  });

  describe('signIn', () => {
    it('posts the sign-in payload to /auth/sign-in', () => {
      const { service, api } = setup();
      const dto: SignInDto = { email: 'a@b.c', password: 'pw' };

      let result: Tokens | undefined;
      service.signIn(dto).subscribe((t) => (result = t));

      expect(api.post).toHaveBeenCalledWith('/auth/sign-in', dto);
      expect(result).toBe(TOKENS);
    });
  });

  describe('signOut', () => {
    it('posts an empty body to /auth/sign-out', () => {
      const { service, api } = setup();
      api.post.mockReturnValueOnce(of({ success: true }));

      let result: { success: true } | undefined;
      service.signOut().subscribe((r) => (result = r));

      expect(api.post).toHaveBeenCalledWith('/auth/sign-out', {});
      expect(result).toEqual({ success: true });
    });
  });

  describe('refresh', () => {
    it('posts an empty body to /auth/refresh', () => {
      const { service, api } = setup();

      let result: Tokens | undefined;
      service.refresh().subscribe((t) => (result = t));

      expect(api.post).toHaveBeenCalledWith('/auth/refresh', {});
      expect(result).toBe(TOKENS);
    });
  });

  describe('updateUser', () => {
    it('patches the user payload to /auth', () => {
      const { service, api } = setup();
      const dto: UpdateUserDto = { displayName: 'B' };

      let result: User | undefined;
      service.updateUser(dto).subscribe((u) => (result = u));

      expect(api.patch).toHaveBeenCalledWith('/auth', dto);
      expect(result).toBe(USER);
    });
  });

  describe('updateSettings', () => {
    it('patches the settings payload to /auth/settings', () => {
      const { service, api } = setup();
      const dto: UpdateUserSettingsDto = {};

      let result: User | undefined;
      service.updateSettings(dto).subscribe((u) => (result = u));

      expect(api.patch).toHaveBeenCalledWith('/auth/settings', dto);
      expect(result).toBe(USER);
    });
  });

  describe('deleteUser', () => {
    it('deletes /auth', () => {
      const { service, api } = setup();

      let result: { success: true } | undefined;
      service.deleteUser().subscribe((r) => (result = r));

      expect(api.delete).toHaveBeenCalledWith('/auth');
      expect(result).toEqual({ success: true });
    });
  });

  describe('changePassword', () => {
    it('patches the password payload to /auth/change-password', () => {
      const { service, api } = setup();
      const dto: ChangePasswordDto = {
        oldPassword: 'old',
        newPassword: 'new',
      };
      api.patch.mockReturnValueOnce(of(TOKENS));

      let result: Tokens | undefined;
      service.changePassword(dto).subscribe((t) => (result = t));

      expect(api.patch).toHaveBeenCalledWith('/auth/change-password', dto);
      expect(result).toBe(TOKENS);
    });
  });
});
