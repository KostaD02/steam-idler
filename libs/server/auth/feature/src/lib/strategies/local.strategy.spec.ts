import { HttpException } from '@nestjs/common';

import { LocalStrategy } from './local.strategy';

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const setup = () => {
  const exceptionService = buildExceptionService();
  const authAccountService = { validateUser: jest.fn() };
  const strategy = new LocalStrategy(
    exceptionService as never,
    authAccountService as never,
  );

  return { strategy, exceptionService, authAccountService };
};

describe('LocalStrategy', () => {
  describe('validate', () => {
    it('returns the validated user', async () => {
      const { strategy, authAccountService } = setup();
      const user = { _id: 'user-id' };
      authAccountService.validateUser.mockResolvedValue(user);

      await expect(strategy.validate('a@b.com', 'secret')).resolves.toBe(user);
      expect(authAccountService.validateUser).toHaveBeenCalledWith(
        'a@b.com',
        'secret',
      );
    });

    it('throws invalid credentials when no user is returned', async () => {
      const { strategy, exceptionService } = setup();

      await expect(strategy.validate('a@b.com', 'wrong')).rejects.toThrow(
        HttpException,
      );
      expect(exceptionService.throw).toHaveBeenCalledWith(
        'errors.bad_request',
        'Invalid credentials',
        ['errors.auth.invalid_credentials'],
      );
    });
  });
});
