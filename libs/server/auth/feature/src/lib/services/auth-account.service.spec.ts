import { HttpException } from '@nestjs/common';

import { Response } from 'express';

jest.mock('@steam-idler/server/auth/core', () => ({
  ...jest.requireActual('@steam-idler/server/auth/core'),
  compareToHash: jest.fn(),
  hashText: jest.fn(),
}));

import { compareToHash, hashText } from '@steam-idler/server/auth/core';

import { AuthAccountService } from './auth-account.service';

const compareMock = compareToHash as jest.Mock;
const hashMock = hashText as jest.Mock;

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const buildUserDoc = (overrides: Record<string, unknown> = {}) => ({
  password: 'hashed',
  toObject: jest.fn().mockReturnValue({
    _id: 'user-id',
    email: 'a@b.com',
    password: 'hashed',
    ...overrides,
  }),
});

const setup = () => {
  const exceptionService = buildExceptionService();
  const authRepository = {
    getByEmail: jest.fn(),
    getById: jest.fn(),
    deleteById: jest.fn(),
    updatePassword: jest.fn(),
    updateById: jest.fn(),
    updateSettings: jest.fn(),
  };
  const authTokenService = {
    issueSession: jest.fn().mockReturnValue('tokens'),
    signOut: jest.fn().mockReturnValue({ success: true }),
  };
  const authValidationService = {
    checkUserExistence: jest.fn((user: unknown) => {
      if (!user) {
        throw new HttpException('User not found', 404);
      }
    }),
  };
  const service = new AuthAccountService(
    exceptionService as never,
    authRepository as never,
    authTokenService as never,
    authValidationService as never,
  );

  return {
    service,
    exceptionService,
    authRepository,
    authTokenService,
    authValidationService,
  };
};

const response = {} as Response;
const user = { _id: 'user-id' } as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthAccountService', () => {
  describe('validateUser', () => {
    it('returns the user without the password when the password matches', async () => {
      const { service, authRepository } = setup();
      authRepository.getByEmail.mockResolvedValue(buildUserDoc());
      compareMock.mockResolvedValue(true);

      const result = await service.validateUser('a@b.com', 'secret');

      expect(result).toEqual({ _id: 'user-id', email: 'a@b.com' });
      expect(result).not.toHaveProperty('password');
    });

    it('returns null when the password does not match', async () => {
      const { service, authRepository } = setup();
      authRepository.getByEmail.mockResolvedValue(buildUserDoc());
      compareMock.mockResolvedValue(false);

      await expect(
        service.validateUser('a@b.com', 'wrong'),
      ).resolves.toBeNull();
    });

    it('throws when no user exists for the email', async () => {
      const { service, authRepository } = setup();
      authRepository.getByEmail.mockResolvedValue(null);

      await expect(service.validateUser('a@b.com', 'secret')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getSerializedUser', () => {
    it('returns the user document as a plain object', async () => {
      const { service, authRepository } = setup();
      const doc = buildUserDoc();
      authRepository.getById.mockResolvedValue(doc);

      const result = await service.getSerializedUser(user);

      expect(authRepository.getById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        _id: 'user-id',
        email: 'a@b.com',
        password: 'hashed',
      });
    });

    it('throws when the user no longer exists', async () => {
      const { service, authRepository } = setup();
      authRepository.getById.mockResolvedValue(null);

      await expect(service.getSerializedUser(user)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteUser', () => {
    it('signs the user out after a successful delete', async () => {
      const { service, authRepository, authTokenService } = setup();
      authRepository.deleteById.mockResolvedValue(true);

      const result = await service.deleteUser(user, response);

      expect(authRepository.deleteById).toHaveBeenCalledWith('user-id');
      expect(authTokenService.signOut).toHaveBeenCalledWith(response);
      expect(result).toEqual({ success: true });
    });

    it('throws when the delete was not acknowledged', async () => {
      const { service, authRepository } = setup();
      authRepository.deleteById.mockResolvedValue(false);

      await expect(service.deleteUser(user, response)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('changePassword', () => {
    const dto = { oldPassword: 'old', newPassword: 'new' } as never;

    it('rotates tokens after persisting the new password', async () => {
      const { service, authRepository, authTokenService } = setup();
      authRepository.getById.mockResolvedValue(buildUserDoc());
      authRepository.updatePassword.mockResolvedValue(buildUserDoc());
      compareMock.mockResolvedValue(true);
      hashMock.mockResolvedValue('new-hash');

      const result = await service.changePassword(user, dto, response);

      expect(hashMock).toHaveBeenCalledWith('new');
      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        'user-id',
        'new-hash',
      );
      expect(authTokenService.issueSession).toHaveBeenCalled();
      expect(result).toBe('tokens');
    });

    it('throws when the old password is incorrect', async () => {
      const { service, authRepository } = setup();
      authRepository.getById.mockResolvedValue(buildUserDoc());
      compareMock.mockResolvedValue(false);

      await expect(service.changePassword(user, dto, response)).rejects.toThrow(
        HttpException,
      );
    });

    it('throws when the new password equals the old one', async () => {
      const { service, authRepository } = setup();
      authRepository.getById.mockResolvedValue(buildUserDoc());
      compareMock.mockResolvedValue(true);

      await expect(
        service.changePassword(
          user,
          { oldPassword: 'same', newPassword: 'same' } as never,
          response,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateUser', () => {
    it('persists only the whitelisted fields and returns the updated user', async () => {
      const { service, authRepository } = setup();
      authRepository.updateById.mockResolvedValue(buildUserDoc());

      const result = await service.updateUser(user, {
        displayName: 'New Name',
        role: 'admin',
      } as never);

      expect(authRepository.updateById).toHaveBeenCalledWith('user-id', {
        displayName: 'New Name',
      });
      expect(result).toEqual({
        _id: 'user-id',
        email: 'a@b.com',
        password: 'hashed',
      });
    });

    it('throws when no whitelisted field was provided', async () => {
      const { service, authRepository } = setup();

      await expect(
        service.updateUser(user, { role: 'admin' } as never),
      ).rejects.toThrow(HttpException);
      expect(authRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('persists only the whitelisted settings', async () => {
      const { service, authRepository } = setup();
      authRepository.updateSettings.mockResolvedValue(buildUserDoc());

      await service.updateSettings(user, {
        showProfileName: false,
        unknown: true,
      } as never);

      expect(authRepository.updateSettings).toHaveBeenCalledWith('user-id', {
        showProfileName: false,
      });
    });

    it('throws when no whitelisted setting was provided', async () => {
      const { service, authRepository } = setup();

      await expect(
        service.updateSettings(user, { unknown: true } as never),
      ).rejects.toThrow(HttpException);
      expect(authRepository.updateSettings).not.toHaveBeenCalled();
    });
  });
});
