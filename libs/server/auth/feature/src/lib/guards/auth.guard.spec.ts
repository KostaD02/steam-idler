import { ExecutionContext, HttpException } from '@nestjs/common';

import { AUTH_TOKENS } from '@steam-idler/server/auth/core';

import { AuthGuard } from './auth.guard';

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 403);
  }),
});

const setup = (
  reflectorValues: { isPublic?: boolean; role?: unknown } = {},
) => {
  const reflector = {
    get: jest.fn((token: symbol) => {
      if (token === AUTH_TOKENS.IS_PUBLIC) {
        return reflectorValues.isPublic;
      }

      return reflectorValues.role;
    }),
  };
  const exceptionService = buildExceptionService();
  const authValidationService = {
    checkUserExistence: jest.fn((user: unknown) => {
      if (!user) {
        throw new HttpException('Invalid credentials', 401);
      }
    }),
  };
  const guard = new AuthGuard(
    reflector as never,
    exceptionService as never,
    authValidationService as never,
  );

  return { guard, reflector, exceptionService, authValidationService };
};

const buildContext = (user: unknown) =>
  ({
    getHandler: () => () => null,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  it('allows public handlers without checking the user', () => {
    const { guard, authValidationService } = setup({ isPublic: true });

    expect(guard.canActivate(buildContext(undefined))).toBe(true);
    expect(authValidationService.checkUserExistence).not.toHaveBeenCalled();
  });

  it('throws when no user is resolved on the request', () => {
    const { guard } = setup({ isPublic: false });

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      HttpException,
    );
  });

  it('allows the request when no role is required', () => {
    const { guard } = setup({ isPublic: false, role: null });

    expect(guard.canActivate(buildContext({ role: 'standard' }))).toBe(true);
  });

  it('allows the request when the user role matches the required role', () => {
    const { guard } = setup({ isPublic: false, role: 'admin' });

    expect(guard.canActivate(buildContext({ role: 'admin' }))).toBe(true);
  });

  it('allows the request when the user role is within a required role array', () => {
    const { guard } = setup({ isPublic: false, role: ['admin', 'standard'] });

    expect(guard.canActivate(buildContext({ role: 'standard' }))).toBe(true);
  });

  it('throws when the user role does not satisfy the required role', () => {
    const { guard, exceptionService } = setup({
      isPublic: false,
      role: 'admin',
    });

    expect(() => guard.canActivate(buildContext({ role: 'standard' }))).toThrow(
      HttpException,
    );
    expect(exceptionService.throw).toHaveBeenCalledWith(
      'errors.forbidden',
      'Role not sufficient',
      ['errors.auth.role_not_sufficient'],
    );
  });
});
