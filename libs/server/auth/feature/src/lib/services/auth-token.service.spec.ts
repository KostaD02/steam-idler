import { HttpException } from '@nestjs/common';

import { Response } from 'express';

jest.mock('@steam-idler/server/auth/core', () => ({
  ...jest.requireActual('@steam-idler/server/auth/core'),
  hashText: jest.fn(),
}));

import { hashText } from '@steam-idler/server/auth/core';

import { AuthTokenService } from './auth-token.service';

const hashMock = hashText as jest.Mock;

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const setup = () => {
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };
  const exceptionService = buildExceptionService();
  const authRepository = {
    emailExists: jest.fn(),
    userCount: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
  };
  const authHelperService = {
    calculateJWTExpirationDate: jest.fn().mockReturnValue(1_000),
  };
  const authValidationService = {
    checkRefreshToken: jest.fn(),
    throwInvalidRefreshToken: jest.fn(() => {
      throw new HttpException('Invalid refresh token', 401);
    }),
    checkUserExistence: jest.fn((user: unknown) => {
      if (!user) {
        throw new HttpException('User not found', 404);
      }
    }),
    checkTokenFreshness: jest.fn(),
  };
  const service = new AuthTokenService(
    jwtService as never,
    exceptionService as never,
    authRepository as never,
    authHelperService as never,
    authValidationService as never,
  );

  return {
    service,
    jwtService,
    exceptionService,
    authRepository,
    authHelperService,
    authValidationService,
  };
};

const buildResponse = () =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    getHeader: jest.fn(),
    req: { cookies: {}, headers: {}, body: {} },
  }) as unknown as Response;

const buildUserDoc = () => ({
  toObject: jest.fn().mockReturnValue({ _id: 'user-id', email: 'a@b.com' }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthTokenService', () => {
  describe('signUp', () => {
    it('creates the first user as an admin and signs them in', async () => {
      const { service, authRepository, jwtService } = setup();
      authRepository.emailExists.mockResolvedValue(false);
      authRepository.userCount.mockResolvedValue(0);
      hashMock.mockResolvedValue('hashed');
      authRepository.create.mockResolvedValue(buildUserDoc());
      const response = buildResponse();

      const result = await service.signUp(
        {
          email: 'a@b.com',
          password: 'secret',
          displayName: 'Tester',
        } as never,
        response,
      );

      const createdPayload = authRepository.create.mock.calls[0][0];

      expect(createdPayload.role).toBe('admin');
      expect(createdPayload.password).toBe('hashed');
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
    });

    it('creates later users as standard', async () => {
      const { service, authRepository } = setup();
      authRepository.emailExists.mockResolvedValue(false);
      authRepository.userCount.mockResolvedValue(3);
      hashMock.mockResolvedValue('hashed');
      authRepository.create.mockResolvedValue(buildUserDoc());

      await service.signUp(
        {
          email: 'a@b.com',
          password: 'secret',
          displayName: 'Tester',
        } as never,
        buildResponse(),
      );

      expect(authRepository.create.mock.calls[0][0].role).toBe('standard');
    });

    it('throws when the email is already taken', async () => {
      const { service, authRepository } = setup();
      authRepository.emailExists.mockResolvedValue(true);

      await expect(
        service.signUp({ email: 'a@b.com' } as never, buildResponse()),
      ).rejects.toThrow(HttpException);
      expect(authRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('signs tokens and sets them as cookies on the response', () => {
      const { service, jwtService } = setup();
      const response = buildResponse();

      const result = service.signIn({ _id: 'user-id' } as never, response);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-token',
        expect.objectContaining({ httpOnly: true, secure: true }),
      );
      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
    });
  });

  describe('signOut', () => {
    it('clears both auth cookies and reports success', () => {
      const { service } = setup();
      const response = buildResponse();

      const result = service.signOut(response);

      expect(response.clearCookie).toHaveBeenCalledWith('access_token');
      expect(response.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({ success: true });
    });
  });

  describe('refreshToken', () => {
    it('issues a new token pair for a valid refresh token', async () => {
      const { service, jwtService, authRepository } = setup();
      const response = buildResponse();
      response.req.cookies = { refresh_token: 'refresh' };
      jwtService.verify.mockReturnValue({ _id: 'user-id' });
      authRepository.getById.mockResolvedValue(buildUserDoc());

      const result = await service.refreshToken({} as Request, response);

      expect(authRepository.getById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
    });

    it('throws an invalid token error when verification fails', async () => {
      const { service, jwtService } = setup();
      const response = buildResponse();
      response.req.cookies = { refresh_token: 'refresh' };
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad token');
      });

      await expect(
        service.refreshToken({} as Request, response),
      ).rejects.toThrow(HttpException);
    });

    it('throws when the refresh token is missing', async () => {
      const { service, authValidationService } = setup();
      authValidationService.checkRefreshToken.mockImplementation(() => {
        throw new HttpException('Refresh token not found', 401);
      });

      await expect(
        service.refreshToken({} as Request, buildResponse()),
      ).rejects.toThrow(HttpException);
    });
  });
});
