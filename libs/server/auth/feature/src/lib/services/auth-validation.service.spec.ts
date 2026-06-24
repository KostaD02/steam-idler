import { HttpException } from '@nestjs/common';

import { Response } from 'express';

import { AuthValidationService } from './auth-validation.service';

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const setup = () => {
  const exceptionService = buildExceptionService();
  const service = new AuthValidationService(exceptionService as never);

  return { service, exceptionService };
};

const buildResponse = () =>
  ({
    clearCookie: jest.fn(),
  }) as unknown as Response;

describe('AuthValidationService', () => {
  describe('checkUserExistence', () => {
    it('passes when a user is provided', () => {
      const { service } = setup();

      expect(() => service.checkUserExistence({} as never)).not.toThrow();
    });

    it('throws a not-found error when the user is missing', () => {
      const { service, exceptionService } = setup();

      expect(() => service.checkUserExistence(null)).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.not_found',
        'User not found',
        ['errors.auth.user_not_found'],
      );
    });

    it('throws an unauthorized error when invalid credentials are flagged', () => {
      const { service, exceptionService } = setup();

      expect(() => service.checkUserExistence(null, true)).toThrow(
        HttpException,
      );
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.unauthorized',
        'Invalid credentials',
        ['errors.auth.invalid_credentials'],
      );
    });
  });

  describe('checkRefreshToken', () => {
    it('passes when a token is present', () => {
      const { service } = setup();

      expect(() => service.checkRefreshToken('token')).not.toThrow();
    });

    it('throws when the token is missing', () => {
      const { service, exceptionService } = setup();

      expect(() => service.checkRefreshToken(undefined)).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.unauthorized',
        'Refresh token not found',
        ['errors.auth.token_not_found'],
      );
    });
  });

  describe('handleInvalidTokenError', () => {
    it('reports an expired token for a TokenExpiredError', () => {
      const { service, exceptionService } = setup();

      expect(() =>
        service.handleInvalidTokenError({ name: 'TokenExpiredError' }),
      ).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Token expired',
        ['errors.auth.token_expired'],
      );
    });

    it('reports an invalid token for any other error', () => {
      const { service, exceptionService } = setup();

      expect(() =>
        service.handleInvalidTokenError({ name: 'JsonWebTokenError' }),
      ).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Invalid token',
        ['errors.auth.invalid_token'],
      );
    });
  });

  describe('throwInvalidRefreshToken', () => {
    it('throws an unauthorized invalid token error', () => {
      const { service, exceptionService } = setup();

      expect(() => service.throwInvalidRefreshToken()).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.unauthorized',
        'Invalid refresh token',
        ['errors.auth.invalid_token'],
      );
    });
  });

  describe('checkTokenFreshness', () => {
    it('does nothing when the token was issued after the password change', () => {
      const { service, exceptionService } = setup();
      const response = buildResponse();

      service.checkTokenFreshness(
        { iat: 2_000_000_000 } as never,
        '2020-01-01T00:00:00.000Z',
        response,
      );

      expect(response.clearCookie).not.toHaveBeenCalled();
      expect(exceptionService.throw).not.toHaveBeenCalled();
    });

    it('clears the cookies and throws when the token predates the password change', () => {
      const { service, exceptionService } = setup();
      const response = buildResponse();

      expect(() =>
        service.checkTokenFreshness(
          { iat: 1 } as never,
          '2020-01-01T00:00:00.000Z',
          response,
        ),
      ).toThrow(HttpException);
      expect(response.clearCookie).toHaveBeenCalledWith('access_token');
      expect(response.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.unauthorized',
        'Token issued before password change',
        ['errors.auth.password_changed'],
      );
    });
  });
});
