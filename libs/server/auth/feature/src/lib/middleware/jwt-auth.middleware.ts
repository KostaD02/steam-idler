import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { NextFunction, Request, Response } from 'express';

import {
  EnvironmentService,
  ExceptionService,
} from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { AUTH_CONFIG } from '@steam-idler/server/auth/core';
import { AuthRepository } from '@steam-idler/server/auth/domain';
import {
  AuthenticatedUser,
  AuthExpectionKeys,
  User,
} from '@steam-idler/server/auth/types';

import { AuthValidationService } from '../services';
import { AuthTokenService } from './../services/auth-token.service';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly env: EnvironmentService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly exceptionService: ExceptionService,
    private readonly authValidationService: AuthValidationService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);

    if (!token) {
      return next();
    }

    let decoded: AuthenticatedUser;

    try {
      decoded = await this.jwtService.verifyAsync(token, {
        secret: this.env.get('JWT_SECRET'),
      });
    } catch (error: unknown) {
      const err = error as { name: string };
      if (err?.name === 'TokenExpiredError') {
        this.exceptionService.throw(
          ExceptionStatusKeys.Unauthorized,
          'Token expired',
          [AuthExpectionKeys.TokenExpired],
        );
      }

      this.authTokenService.signOut(res);
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Invalid token',
        [AuthExpectionKeys.InvalidToken],
      );
    }

    const user = await this.authRepository.getById(String(decoded._id), true);

    if (!user) {
      res.clearCookie(AUTH_CONFIG.ACCESS_TOKEN_KEY);
      res.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      this.authValidationService.checkUserExistence(user);
    }

    req.user = user.toObject<User>();
    return next();
  }

  private extractToken(req: Request): string {
    const authHeader = req.headers?.authorization ?? '';
    const cookieToken = req.cookies?.[AUTH_CONFIG.ACCESS_TOKEN_KEY] ?? '';

    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return cookieToken;
  }
}
