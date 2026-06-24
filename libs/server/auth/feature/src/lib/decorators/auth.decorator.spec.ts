import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import { AUTH_TOKENS } from '@steam-idler/server/auth/core';
import { UserRoleEnum } from '@steam-idler/server/auth/types';

import { Auth } from './auth.decorator';
import { AuthGuard } from '../guards/auth.guard';

describe('Auth', () => {
  it('defaults the required role to null and registers the auth guard', () => {
    class Target {
      @Auth()
      handler() {
        return null;
      }
    }

    const reflector = new Reflector();
    const role = reflector.get(AUTH_TOKENS.ROLE_KEY, Target.prototype.handler);
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      Target.prototype.handler,
    );

    expect(role).toBeNull();
    expect(guards).toContain(AuthGuard);
  });

  it('stores the provided role on the handler metadata', () => {
    class Target {
      @Auth(UserRoleEnum.Admin)
      handler() {
        return null;
      }
    }

    const reflector = new Reflector();
    const role = reflector.get(AUTH_TOKENS.ROLE_KEY, Target.prototype.handler);

    expect(role).toBe(UserRoleEnum.Admin);
  });
});
