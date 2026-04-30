import { Injectable } from '@nestjs/common';

import { Response } from 'express';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { AUTH_CONFIG } from '@steam-idler/server/auth/core';
import { UserDocument } from '@steam-idler/server/auth/domain';
import {
  AuthenticatedUser,
  AuthExpectionKeys,
  UserExceptionKeys,
} from '@steam-idler/server/auth/types';

@Injectable()
export class AuthValidationService {
  constructor(private readonly exceptionService: ExceptionService) {}

  checkUserExistence(
    user?: UserDocument | null,
    invalidCreds = false,
  ): asserts user is UserDocument {
    if (!user) {
      this.exceptionService.throw(
        invalidCreds
          ? ExceptionStatusKeys.Unauthorized
          : ExceptionStatusKeys.NotFound,
        invalidCreds ? 'Invalid credentials' : 'User not found',
        [
          invalidCreds
            ? AuthExpectionKeys.InvalidCredentials
            : UserExceptionKeys.NotFound,
        ],
      );
    }
  }

  checkRefreshToken(token?: string): void | never {
    if (!token) {
      this.exceptionService.throw(
        ExceptionStatusKeys.Unauthorized,
        'Refresh token not found',
        [AuthExpectionKeys.TokenNotFound],
      );
    }
  }

  handleInvalidTokenError(error: unknown): never {
    const err = error as { name: string };
    const errorName = err?.name || '';
    const isTokenExpired = errorName === 'TokenExpiredError';
    const message = isTokenExpired ? 'Token expired' : 'Invalid token';
    const errorKeys = isTokenExpired
      ? [AuthExpectionKeys.TokenExpired]
      : [AuthExpectionKeys.InvalidToken];

    this.exceptionService.throw(
      ExceptionStatusKeys.BadRequest,
      message,
      errorKeys,
    );
  }

  throwInvalidRefreshToken(): never {
    this.exceptionService.throw(
      ExceptionStatusKeys.Unauthorized,
      'Invalid refresh token',
      [AuthExpectionKeys.InvalidToken],
    );
  }

  checkTokenFreshness(
    decoded: AuthenticatedUser,
    passwordChangedAt: string,
    response: Response,
  ): void {
    const passwordChangedAtSec = Math.floor(
      new Date(passwordChangedAt).getTime() / 1000,
    );

    if (decoded.iat < passwordChangedAtSec) {
      response.clearCookie(AUTH_CONFIG.ACCESS_TOKEN_KEY);
      response.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      this.exceptionService.throw(
        ExceptionStatusKeys.Unauthorized,
        'Token issued before password change',
        [AuthExpectionKeys.PasswordChanged],
      );
    }
  }
}
