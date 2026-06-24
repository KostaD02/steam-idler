import { ExecutionContext, HttpException } from '@nestjs/common';

import { MFA_CONFIG } from '@steam-idler/server/auth/core';
import { TOKEN_SCOPES } from '@steam-idler/server/auth/types';

import { MfaPendingGuard } from './mfa-pending.guard';

const buildContext = (request: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const setup = () => {
  const env = { get: jest.fn().mockReturnValue('jwt-secret') };
  const jwtService = { verifyAsync: jest.fn() };
  const authRepository = { getById: jest.fn() };
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 401);
    }),
  };
  const authValidationService = {
    checkUserExistence: jest.fn((user: unknown) => {
      if (!user) {
        throw new HttpException('User not found', 404);
      }
    }),
  };
  const guard = new MfaPendingGuard(
    env as never,
    jwtService as never,
    authRepository as never,
    exceptionService as never,
    authValidationService as never,
  );

  return { guard, jwtService, authRepository };
};

const withToken = (token = 'pending-token') => ({
  cookies: { [MFA_CONFIG.PENDING_TOKEN_KEY]: token },
});

describe('MfaPendingGuard', () => {
  it('throws when the pending cookie is missing', async () => {
    const { guard, jwtService } = setup();

    await expect(
      guard.canActivate(buildContext({ cookies: {} })),
    ).rejects.toThrow(HttpException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws when the pending token cannot be verified', async () => {
    const { guard, jwtService } = setup();
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

    await expect(guard.canActivate(buildContext(withToken()))).rejects.toThrow(
      HttpException,
    );
  });

  it('throws when the token scope is not mfa-pending', async () => {
    const { guard, jwtService } = setup();
    jwtService.verifyAsync.mockResolvedValue({ _id: 'u1', scope: 'access' });

    await expect(guard.canActivate(buildContext(withToken()))).rejects.toThrow(
      HttpException,
    );
  });

  it('throws when the pending user no longer exists', async () => {
    const { guard, jwtService, authRepository } = setup();
    jwtService.verifyAsync.mockResolvedValue({
      _id: 'u1',
      scope: TOKEN_SCOPES.MfaPending,
    });
    authRepository.getById.mockResolvedValue(null);

    await expect(guard.canActivate(buildContext(withToken()))).rejects.toThrow(
      HttpException,
    );
  });

  it('attaches the user and allows the request on success', async () => {
    const { guard, jwtService, authRepository } = setup();
    const sessionUser = { _id: 'u1', email: 'a@b.com' };
    jwtService.verifyAsync.mockResolvedValue({
      _id: 'u1',
      scope: TOKEN_SCOPES.MfaPending,
    });
    authRepository.getById.mockResolvedValue({
      toObject: () => sessionUser,
    });
    const request = withToken() as Record<string, unknown>;

    const result = await guard.canActivate(buildContext(request));

    expect(result).toBe(true);
    expect(request['user']).toBe(sessionUser);
  });
});
