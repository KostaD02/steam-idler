import { ExecutionContext, HttpException } from '@nestjs/common';

import { LocalAuthGuard } from './local-auth.guard';

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const setup = () => {
  const exceptionService = buildExceptionService();
  const guard = new LocalAuthGuard(exceptionService as never);

  return { guard, exceptionService };
};

const buildContext = (body: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  }) as unknown as ExecutionContext;

describe('LocalAuthGuard', () => {
  describe('handleRequest', () => {
    it('returns the user when authentication succeeds', () => {
      const { guard } = setup();
      const user = { _id: 'user-id' };

      const result = guard.handleRequest(
        null as never,
        user,
        null,
        buildContext({ email: 'a@b.com', password: 'secret' }),
      );

      expect(result).toBe(user);
    });

    it('throws asking for both fields when neither is provided', () => {
      const { guard, exceptionService } = setup();

      expect(() =>
        guard.handleRequest(null as never, null, null, buildContext({})),
      ).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Should provide credentials',
        [
          'errors.auth.should_provide_email',
          'errors.auth.should_provide_password',
        ],
      );
    });

    it('throws asking for the email when only the password is provided', () => {
      const { guard, exceptionService } = setup();

      expect(() =>
        guard.handleRequest(
          null as never,
          null,
          null,
          buildContext({ password: 'secret' }),
        ),
      ).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Email should be provided',
        ['errors.auth.should_provide_email'],
      );
    });

    it('throws asking for the password when only the email is provided', () => {
      const { guard, exceptionService } = setup();

      expect(() =>
        guard.handleRequest(
          null as never,
          null,
          null,
          buildContext({ email: 'a@b.com' }),
        ),
      ).toThrow(HttpException);
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Password should be provided',
        ['errors.auth.should_provide_password'],
      );
    });

    it('rethrows the original error when both fields are present but auth failed', () => {
      const { guard } = setup();
      const error = new Error('passport failure');

      expect(() =>
        guard.handleRequest(
          error,
          null,
          null,
          buildContext({ email: 'a@b.com', password: 'wrong' }),
        ),
      ).toThrow(error);
    });
  });
});
