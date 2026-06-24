import { HttpException } from '@nestjs/common';

import { CacheRegistry } from '@steam-idler/server/infra/cache';

import { SteamPersonaStatusEnum } from '@steam-idler/server/steam-account/types';

import { SteamAccountRepository } from './steam-account.repository';

const chainableExec = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

const buildModelStub = () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
});

const buildCacheServiceStub = () => ({
  get: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(true),
});

const buildEnvStub = () => ({
  get: jest.fn().mockReturnValue(undefined),
});

const setup = () => {
  const steamAccountModel = buildModelStub();
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 400);
    }),
  };
  const cacheService = buildCacheServiceStub();
  const environmentService = buildEnvStub();

  CacheRegistry.register(cacheService as never, environmentService as never);

  const repository = new SteamAccountRepository(
    steamAccountModel as never,
    exceptionService as never,
  );

  return {
    repository,
    steamAccountModel,
    exceptionService,
    cacheService,
    environmentService,
  };
};

describe('SteamAccountRepository', () => {
  describe('getAll', () => {
    it('returns every account from the model', async () => {
      const { repository, steamAccountModel } = setup();
      const accounts = [{ accountName: 'one' }, { accountName: 'two' }];
      steamAccountModel.find.mockReturnValue(chainableExec(accounts));

      await expect(repository.getAll()).resolves.toBe(accounts);
      expect(steamAccountModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('getById', () => {
    it('looks the account up by its id', async () => {
      const { repository, steamAccountModel } = setup();
      const account = { accountName: 'one' };
      steamAccountModel.findById.mockReturnValue(chainableExec(account));

      await expect(repository.getById('account-id')).resolves.toBe(account);
      expect(steamAccountModel.findById).toHaveBeenCalledWith('account-id');
    });
  });

  describe('getByUserId', () => {
    it('omits credentials and defaults a missing profile', async () => {
      const { repository, steamAccountModel } = setup();
      const lean = chainableExec([
        { accountName: 'one', profile: { name: 'Player', avatarUrl: 'url' } },
        { accountName: 'two', profile: undefined },
      ]);
      steamAccountModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue(lean),
        }),
      });

      const result = await repository.getByUserId('user-id' as never);

      expect(steamAccountModel.find).toHaveBeenCalledWith({
        userId: 'user-id',
      });
      expect(result).toEqual([
        { accountName: 'one', profile: { name: 'Player', avatarUrl: 'url' } },
        { accountName: 'two', profile: { name: '', avatarUrl: '' } },
      ]);
    });

    it('caches the resolved accounts under the user key', async () => {
      const { repository, steamAccountModel, cacheService } = setup();
      const lean = chainableExec([
        { accountName: 'one', profile: { name: 'Player', avatarUrl: 'url' } },
      ]);
      steamAccountModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue(lean),
        }),
      });

      await repository.getByUserId('user-id' as never);

      expect(cacheService.set).toHaveBeenCalledWith(
        'SteamAccountRepository:user:user-id',
        expect.anything(),
        undefined,
      );
    });

    it('returns the cached value without hitting the model', async () => {
      const { repository, steamAccountModel, cacheService } = setup();
      const cached = [{ accountName: 'cached' }];
      cacheService.get.mockResolvedValue(cached);

      await expect(repository.getByUserId('user-id' as never)).resolves.toBe(
        cached,
      );
      expect(steamAccountModel.find).not.toHaveBeenCalled();
    });
  });

  describe('getByName', () => {
    it('looks the account up by its name', async () => {
      const { repository, steamAccountModel } = setup();
      const account = { accountName: 'tester' };
      steamAccountModel.findOne.mockReturnValue(chainableExec(account));

      await expect(repository.getByName('tester')).resolves.toBe(account);
      expect(steamAccountModel.findOne).toHaveBeenCalledWith({
        accountName: 'tester',
      });
    });
  });

  describe('existsByName', () => {
    it('delegates the existence check to the model', () => {
      const { repository, steamAccountModel } = setup();
      const existsResult = { _id: 'account-id' };
      steamAccountModel.exists.mockReturnValue(existsResult);

      expect(repository.existsByName('tester')).toBe(existsResult);
      expect(steamAccountModel.exists).toHaveBeenCalledWith({
        accountName: 'tester',
      });
    });
  });

  describe('create', () => {
    it('persists a fully defaulted account for the user', async () => {
      const { repository, steamAccountModel } = setup();
      const created = { accountName: 'tester' };
      steamAccountModel.create.mockResolvedValue(created);

      const result = await repository.create('tester', 'user-id' as never);

      expect(result).toBe(created);
      expect(steamAccountModel.create).toHaveBeenCalledWith({
        userId: 'user-id',
        accountName: 'tester',
        displayedGameName: '',
        profile: { name: '', avatarUrl: '' },
        credentials: { id: '', cookies: [], refreshToken: '' },
        idleSettings: {
          idleEnabled: false,
          personaStatus: SteamPersonaStatusEnum.Online,
          idleGameIds: [],
          autoReply: { enabled: false, template: '', whileIdling: false },
        },
      });
    });

    it('evicts the cached accounts for the owning user', async () => {
      const { repository, steamAccountModel, cacheService } = setup();
      steamAccountModel.create.mockResolvedValue({ accountName: 'tester' });

      await repository.create('tester', 'user-id' as never);

      expect(cacheService.del).toHaveBeenCalledWith(
        'SteamAccountRepository:user:user-id',
      );
    });
  });

  describe('updateById', () => {
    it('forwards the partial update to the model', () => {
      const { repository, steamAccountModel } = setup();
      const updateResult = { accountName: 'tester' };
      steamAccountModel.findByIdAndUpdate.mockReturnValue(updateResult);

      expect(
        repository.updateById('account-id', { displayedGameName: 'Game' }),
      ).toBe(updateResult);
      expect(steamAccountModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'account-id',
        { displayedGameName: 'Game' },
      );
    });
  });

  describe('updateProfile', () => {
    it('sets the profile sub-document', async () => {
      const { repository, steamAccountModel } = setup();
      const profile = { name: 'Player', avatarUrl: 'url' };
      const updated = { accountName: 'tester' };
      steamAccountModel.findByIdAndUpdate.mockReturnValue(
        chainableExec(updated),
      );

      await expect(
        repository.updateProfile('account-id', profile),
      ).resolves.toBe(updated);
      expect(steamAccountModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'account-id',
        { $set: { profile } },
      );
    });
  });

  describe('updateCredentials', () => {
    it('flattens the credential keys into a dotted set update', async () => {
      const { repository, steamAccountModel } = setup();
      steamAccountModel.findByIdAndUpdate.mockReturnValue(
        chainableExec(undefined),
      );

      await repository.updateCredentials('account-id', {
        refreshToken: 'token',
        cookies: ['a', 'b'],
      });

      expect(steamAccountModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'account-id',
        {
          $set: {
            'credentials.refreshToken': 'token',
            'credentials.cookies': ['a', 'b'],
          },
        },
      );
    });
  });

  describe('evictUserAccounts', () => {
    it('resolves and evicts the cached accounts for the user', async () => {
      const { repository, cacheService } = setup();

      await expect(
        repository.evictUserAccounts('user-id' as never),
      ).resolves.toBeUndefined();
      expect(cacheService.del).toHaveBeenCalledWith(
        'SteamAccountRepository:user:user-id',
      );
    });
  });

  describe('deleteById', () => {
    it('deletes the account when it exists', async () => {
      const { repository, steamAccountModel } = setup();
      const account = {
        deleteOne: jest
          .fn()
          .mockReturnValue(chainableExec({ acknowledged: true })),
      };
      steamAccountModel.findById.mockReturnValue(chainableExec(account));

      await expect(repository.deleteById('account-id')).resolves.toEqual({
        success: true,
      });
      expect(account.deleteOne).toHaveBeenCalled();
    });

    it('throws when the account is missing', async () => {
      const { repository, steamAccountModel, exceptionService } = setup();
      steamAccountModel.findById.mockReturnValue(chainableExec(null));

      await expect(repository.deleteById('account-id')).rejects.toThrow(
        HttpException,
      );
      expect(exceptionService.throw).toHaveBeenCalled();
    });
  });

  describe('deleteByAccountName', () => {
    it('deletes the account when it exists', async () => {
      const { repository, steamAccountModel } = setup();
      const account = {
        deleteOne: jest
          .fn()
          .mockReturnValue(chainableExec({ acknowledged: false })),
      };
      steamAccountModel.findOne.mockReturnValue(chainableExec(account));

      await expect(repository.deleteByAccountName('tester')).resolves.toEqual({
        success: false,
      });
      expect(steamAccountModel.findOne).toHaveBeenCalledWith({
        accountName: 'tester',
      });
    });

    it('throws when the account is missing', async () => {
      const { repository, steamAccountModel } = setup();
      steamAccountModel.findOne.mockReturnValue(chainableExec(null));

      await expect(repository.deleteByAccountName('tester')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
