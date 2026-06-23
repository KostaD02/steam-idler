import { Reflector } from '@nestjs/core';

import { AUTH_TOKENS } from '@steam-idler/server/auth/core';

import { Public } from './public.decorator';

describe('Public', () => {
  it('attaches the public marker metadata to the handler', () => {
    class Target {
      @Public()
      handler() {
        return null;
      }
    }

    const reflector = new Reflector();
    const value = reflector.get<boolean>(
      AUTH_TOKENS.IS_PUBLIC,
      Target.prototype.handler,
    );

    expect(value).toBe(true);
  });
});
