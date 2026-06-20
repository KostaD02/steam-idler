import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';

import {
  EnvironmentService,
  ExceptionService,
} from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { MFA_CONFIG } from '@steam-idler/server/auth/core';
import { AuthRepository } from '@steam-idler/server/auth/domain';
import {
  AuthenticatedUser,
  AuthExpectionKeys,
  TOKEN_SCOPES,
  User,
} from '@steam-idler/server/auth/types';

import { AuthValidationService } from '../services';

@Injectable()
export class MfaPendingGuard implements CanActivate {
  constructor(
    private readonly env: EnvironmentService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly exceptionService: ExceptionService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[MFA_CONFIG.PENDING_TOKEN_KEY];

    if (!token) {
      this.exceptionService.throw(
        ExceptionStatusKeys.Unauthorized,
        'Two-factor authentication is required',
        [AuthExpectionKeys.MfaRequired],
      );
    }

    let decoded: AuthenticatedUser;

    try {
      decoded = await this.jwtService.verifyAsync(token, {
        secret: this.env.get('JWT_SECRET'),
      });
    } catch {
      this.exceptionService.throw(
        ExceptionStatusKeys.Unauthorized,
        'Invalid two-factor session',
        [AuthExpectionKeys.InvalidToken],
      );
    }

    if (decoded.scope !== TOKEN_SCOPES.MfaPending) {
      this.exceptionService.throw(
        ExceptionStatusKeys.Unauthorized,
        'Invalid two-factor session',
        [AuthExpectionKeys.InvalidToken],
      );
    }

    const user = await this.authRepository.getById(String(decoded._id));
    this.authValidationService.checkUserExistence(user);

    request.user = user.toObject<User>();
    return true;
  }
}
