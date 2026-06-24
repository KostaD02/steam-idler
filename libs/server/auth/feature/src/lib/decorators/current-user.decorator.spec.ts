import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { User } from '@steam-idler/server/auth/types';

import { CurrentUser } from './current-user.decorator';

const getParamFactory = () => {
  class Target {
    handler(@CurrentUser() _user: User) {
      return _user;
    }
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Target, 'handler');
  const key = Object.keys(metadata)[0];

  return metadata[key].factory as (
    data: unknown,
    context: ExecutionContext,
  ) => unknown;
};

const buildContext = (user: unknown) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('CurrentUser', () => {
  it('extracts the user attached to the request', async () => {
    const factory = getParamFactory();
    const user = { _id: 'user-id', email: 'a@b.com' };

    await expect(factory(undefined, buildContext(user))).resolves.toBe(user);
  });

  it('returns undefined when no user is present on the request', async () => {
    const factory = getParamFactory();

    await expect(
      factory(undefined, buildContext(undefined)),
    ).resolves.toBeUndefined();
  });
});
