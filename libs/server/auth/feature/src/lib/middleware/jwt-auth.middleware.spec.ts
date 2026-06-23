import { HttpException } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

import { JwtAuthMiddleware } from './jwt-auth.middleware';

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const setup = () => {
  const env = { get: jest.fn().mockReturnValue('jwt-secret') };
  const jwtService = { verifyAsync: jest.fn() };
  const authRepository = { getById: jest.fn() };
  const exceptionService = buildExceptionService();
  const authValidationService = {
    checkUserExistence: jest.fn((user: unknown) => {
      if (!user) {
        throw new HttpException('User not found', 404);
      }
    }),
    checkTokenFreshness: jest.fn(),
  };
  const authTokenService = { signOut: jest.fn() };
  const middleware = new JwtAuthMiddleware(
    env as never,
    jwtService as never,
    authRepository as never,
    exceptionService as never,
    authValidationService as never,
    authTokenService as never,
  );

  return {
    middleware,
    env,
    jwtService,
    authRepository,
    exceptionService,
    authValidationService,
    authTokenService,
  };
};

const buildRequest = (overrides: Partial<Request> = {}) =>
  ({
    headers: {},
    cookies: {},
    ...overrides,
  }) as unknown as Request;

const buildResponse = () =>
  ({
    clearCookie: jest.fn(),
  }) as unknown as Response;

const buildUserDoc = () => ({
  passwordChangedAt: '2020-01-01T00:00:00.000Z',
  toObject: jest.fn().mockReturnValue({ _id: 'user-id' }),
});

describe('JwtAuthMiddleware', () => {
  describe('use', () => {
    it('skips authentication when no token is present', async () => {
      const { middleware, jwtService } = setup();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(), buildResponse(), next);

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('attaches the user and continues for a valid bearer token', async () => {
      const { middleware, jwtService, authRepository } = setup();
      jwtService.verifyAsync.mockResolvedValue({ _id: 'user-id', iat: 1 });
      authRepository.getById.mockResolvedValue(buildUserDoc());
      const req = buildRequest({
        headers: { authorization: 'Bearer header-token' },
      });
      const next = jest.fn() as NextFunction;

      await middleware.use(req, buildResponse(), next);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', {
        secret: 'jwt-secret',
      });
      expect((req as unknown as { user: unknown }).user).toEqual({
        _id: 'user-id',
      });
      expect(next).toHaveBeenCalled();
    });

    it('reads the token from the access cookie when there is no bearer header', async () => {
      const { middleware, jwtService, authRepository } = setup();
      jwtService.verifyAsync.mockResolvedValue({ _id: 'user-id', iat: 1 });
      authRepository.getById.mockResolvedValue(buildUserDoc());
      const req = buildRequest({
        cookies: { access_token: 'cookie-token' },
      });

      await middleware.use(req, buildResponse(), jest.fn() as NextFunction);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie-token', {
        secret: 'jwt-secret',
      });
    });

    it('throws an expired error when verification reports an expired token', async () => {
      const { middleware, jwtService, exceptionService } = setup();
      jwtService.verifyAsync.mockRejectedValue({ name: 'TokenExpiredError' });
      const req = buildRequest({
        cookies: { access_token: 'cookie-token' },
      });

      await expect(
        middleware.use(req, buildResponse(), jest.fn() as NextFunction),
      ).rejects.toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.unauthorized',
        'Token expired',
        ['errors.auth.token_expired'],
      );
    });

    it('signs out and throws an invalid token error for other verification failures', async () => {
      const { middleware, jwtService, exceptionService, authTokenService } =
        setup();
      jwtService.verifyAsync.mockRejectedValue({ name: 'JsonWebTokenError' });
      const res = buildResponse();
      const req = buildRequest({
        cookies: { access_token: 'cookie-token' },
      });

      await expect(
        middleware.use(req, res, jest.fn() as NextFunction),
      ).rejects.toThrow(HttpException);
      expect(authTokenService.signOut).toHaveBeenCalledWith(res);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Invalid token',
        ['errors.auth.invalid_token'],
      );
    });

    it('clears cookies and throws when the user no longer exists', async () => {
      const { middleware, jwtService, authRepository } = setup();
      jwtService.verifyAsync.mockResolvedValue({ _id: 'user-id', iat: 1 });
      authRepository.getById.mockResolvedValue(null);
      const res = buildResponse();
      const req = buildRequest({
        cookies: { access_token: 'cookie-token' },
      });

      await expect(
        middleware.use(req, res, jest.fn() as NextFunction),
      ).rejects.toThrow(HttpException);
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });
});
