import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { AUTH_TOKENS } from '@steam-idler/server/auth/core';
import { UserRole } from '@steam-idler/server/auth/types';

import { AuthGuard } from '../guards/auth.guard';

export const Auth = (role: UserRole | UserRole[] | null = null) =>
  applyDecorators(
    SetMetadata(AUTH_TOKENS.ROLE_KEY, role),
    UseGuards(AuthGuard),
  );
