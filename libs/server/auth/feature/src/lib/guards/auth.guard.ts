import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { AUTH_TOKENS } from '@steam-idler/server/auth/core';
import { UserExceptionKeys, UserRole } from '@steam-idler/server/auth/types';

import { AuthValidationService } from './../services/auth-validation.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly exceptionService: ExceptionService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();

    const isPublic = this.reflector.get<boolean>(
      AUTH_TOKENS.IS_PUBLIC,
      handler,
    );

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    this.authValidationService.checkUserExistence(user, true);
    const requiredRole = this.reflector.get<UserRole | UserRole[] | null>(
      AUTH_TOKENS.ROLE_KEY,
      handler,
    );

    const isRoleArray = Array.isArray(requiredRole);
    const isUserRoleValid = isRoleArray
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (requiredRole && !isUserRoleValid) {
      this.exceptionService.throw(
        ExceptionStatusKeys.Forbidden,
        'Role not sufficient',
        [UserExceptionKeys.RoleNotSufficient],
      );
    }

    return true;
  }
}
