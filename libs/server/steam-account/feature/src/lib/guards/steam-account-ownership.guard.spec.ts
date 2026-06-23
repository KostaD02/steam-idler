import { ExecutionContext, HttpException } from '@nestjs/common';

import { SteamAccountOwnershipGuard } from './steam-account-ownership.guard';

const buildContext = (request: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const setup = () => {
  const steamAccountRepository = {
    getByName: jest.fn(),
  };
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 404);
    }),
  };

  const guard = new SteamAccountOwnershipGuard(
    steamAccountRepository as never,
    exceptionService as never,
  );

  return { guard, steamAccountRepository, exceptionService };
};

describe('SteamAccountOwnershipGuard', () => {
  it('allows the request when the account belongs to the user', async () => {
    const { guard, steamAccountRepository } = setup();
    steamAccountRepository.getByName.mockResolvedValue({ userId: 'user-1' });

    const context = buildContext({
      user: { _id: 'user-1' },
      params: { name: 'tester' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(steamAccountRepository.getByName).toHaveBeenCalledWith('tester');
  });

  it('throws when there is no authenticated user', async () => {
    const { guard } = setup();

    const context = buildContext({ params: { name: 'tester' } });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
  });

  it('throws when the account name param is missing', async () => {
    const { guard } = setup();

    const context = buildContext({ user: { _id: 'user-1' }, params: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
  });

  it('throws when the account does not exist', async () => {
    const { guard, steamAccountRepository } = setup();
    steamAccountRepository.getByName.mockResolvedValue(null);

    const context = buildContext({
      user: { _id: 'user-1' },
      params: { name: 'tester' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
  });

  it('throws when the account belongs to another user', async () => {
    const { guard, steamAccountRepository } = setup();
    steamAccountRepository.getByName.mockResolvedValue({ userId: 'someone' });

    const context = buildContext({
      user: { _id: 'user-1' },
      params: { name: 'tester' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
  });
});
