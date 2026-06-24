import { HttpException } from '@nestjs/common';

import { Model } from 'mongoose';

import { ExceptionStatusKeys, MongoId } from '@steam-idler/server/infra/types';

import { AuthRepository } from './auth.repository';
import {
  UserCreateDto,
  UserSettingsUpdateDto,
  UserUpdateDto,
} from './auth.repository-types';
import { UserDocument } from './auth.schema';

const exec = <T>(value: T) => ({ exec: jest.fn().mockResolvedValue(value) });

const buildUserModel = () => ({
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
});

const buildExceptionService = () => ({
  throw: jest.fn((_status: string, message: string) => {
    throw new HttpException(message, 400);
  }),
});

const setup = () => {
  const userModel = buildUserModel();
  const exceptionService = buildExceptionService();
  const repository = new AuthRepository(
    userModel as unknown as Model<UserDocument>,
    exceptionService as never,
  );

  return { repository, userModel, exceptionService };
};

describe('AuthRepository', () => {
  describe('userCount', () => {
    it('counts every document', async () => {
      const { repository, userModel } = setup();
      userModel.countDocuments.mockReturnValue(exec(7));

      await expect(repository.userCount()).resolves.toBe(7);
      expect(userModel.countDocuments).toHaveBeenCalledWith({});
    });
  });

  describe('getByEmail', () => {
    it('queries by email without selecting the password by default', async () => {
      const { repository, userModel } = setup();
      const select = jest.fn();
      userModel.findOne.mockReturnValue({ select, ...exec('user') });

      await expect(repository.getByEmail('a@b.c')).resolves.toBe('user');
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'a@b.c' });
      expect(select).not.toHaveBeenCalled();
    });

    it('selects the password when asked to include it', async () => {
      const { repository, userModel } = setup();
      const select = jest.fn();
      userModel.findOne.mockReturnValue({ select, ...exec('user') });

      await repository.getByEmail('a@b.c', true);

      expect(select).toHaveBeenCalledWith('+password');
    });
  });

  describe('getById', () => {
    it('queries by id without selecting the password by default', async () => {
      const { repository, userModel } = setup();
      const select = jest.fn();
      userModel.findById.mockReturnValue({ select, ...exec('user') });

      await expect(repository.getById('id-1')).resolves.toBe('user');
      expect(userModel.findById).toHaveBeenCalledWith('id-1');
      expect(select).not.toHaveBeenCalled();
    });

    it('selects the password when asked to include it', async () => {
      const { repository, userModel } = setup();
      const select = jest.fn();
      userModel.findById.mockReturnValue({ select, ...exec('user') });

      await repository.getById('id-1', true);

      expect(select).toHaveBeenCalledWith('+password');
    });
  });

  describe('emailExists', () => {
    it('delegates to the model exists query', async () => {
      const { repository, userModel } = setup();
      userModel.exists.mockReturnValue(exec({ _id: 'id-1' }));

      await expect(repository.emailExists('a@b.c')).resolves.toEqual({
        _id: 'id-1',
      });
      expect(userModel.exists).toHaveBeenCalledWith({ email: 'a@b.c' });
    });
  });

  describe('getByIdWithMfa', () => {
    it('selects the totp secret and recovery codes', async () => {
      const { repository, userModel } = setup();
      const select = jest.fn().mockReturnValue(exec('user'));
      userModel.findById.mockReturnValue({ select });

      await expect(repository.getByIdWithMfa('id-1')).resolves.toBe('user');
      expect(userModel.findById).toHaveBeenCalledWith('id-1');
      expect(select).toHaveBeenCalledWith('+totpSecret +mfaRecoveryCodes');
    });
  });

  describe('setTotpSecret', () => {
    it('stores the encrypted secret and keeps mfa disabled', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await expect(repository.setTotpSecret('id-1', 'enc')).resolves.toBe(
        'updated',
      );
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        { totpSecret: 'enc', mfaEnabled: false },
        { returnDocument: 'after' },
      );
    });
  });

  describe('enableMfa', () => {
    it('enables mfa and stores the hashed recovery codes', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await repository.enableMfa('id-1', ['h1', 'h2']);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        { mfaEnabled: true, mfaRecoveryCodes: ['h1', 'h2'] },
        { returnDocument: 'after' },
      );
    });
  });

  describe('disableMfa', () => {
    it('disables mfa and unsets the secret and recovery codes', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await repository.disableMfa('id-1');

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        {
          $set: { mfaEnabled: false },
          $unset: { totpSecret: '', mfaRecoveryCodes: '' },
        },
        { returnDocument: 'after' },
      );
    });
  });

  describe('pullRecoveryCode', () => {
    it('removes the consumed recovery code', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await repository.pullRecoveryCode('id-1', 'hashed-1');

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        { $pull: { mfaRecoveryCodes: 'hashed-1' } },
        { returnDocument: 'after' },
      );
    });
  });

  describe('create', () => {
    it('forwards the dto to the model', async () => {
      const { repository, userModel } = setup();
      const dto = { email: 'a@b.c', displayName: 'A' } as UserCreateDto;
      userModel.create.mockResolvedValue('created');

      await expect(repository.create(dto)).resolves.toBe('created');
      expect(userModel.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateById', () => {
    it('updates and returns the document after the change', async () => {
      const { repository, userModel } = setup();
      const dto = { displayName: 'B' } as UserUpdateDto;
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await expect(repository.updateById('id-1', dto)).resolves.toBe('updated');
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('id-1', dto, {
        returnDocument: 'after',
      });
    });
  });

  describe('updateSettings', () => {
    it('flattens settings into dotted $set paths', async () => {
      const { repository, userModel } = setup();
      const settings = {
        showProfileName: false,
        maskAccountName: true,
      } as UserSettingsUpdateDto;
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await expect(repository.updateSettings('id-1', settings)).resolves.toBe(
        'updated',
      );
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        {
          $set: {
            'settings.showProfileName': false,
            'settings.maskAccountName': true,
          },
        },
        { returnDocument: 'after' },
      );
    });
  });

  describe('pushSteamAccount', () => {
    it('adds the account id to the set', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await repository.pushSteamAccount('user-1' as MongoId, 'account-1');

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        { $addToSet: { steamAccounts: 'account-1' } },
        { returnDocument: 'after' },
      );
    });
  });

  describe('pullSteamAccount', () => {
    it('removes the account id from the array', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await repository.pullSteamAccount('user-1' as MongoId, 'account-1');

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        { $pull: { steamAccounts: 'account-1' } },
        { returnDocument: 'after' },
      );
    });
  });

  describe('updatePassword', () => {
    it('stores the hashed password and stamps the change time', async () => {
      const { repository, userModel } = setup();
      userModel.findByIdAndUpdate.mockReturnValue(exec('updated'));

      await repository.updatePassword('id-1', 'hashed');

      const [id, update, options] = userModel.findByIdAndUpdate.mock.calls[0];

      expect(id).toBe('id-1');
      expect(update.password).toBe('hashed');
      expect(typeof update.passwordChangedAt).toBe('string');
      expect(options).toEqual({ returnDocument: 'after' });
    });
  });

  describe('deleteById', () => {
    it('deletes the user and returns the acknowledgement flag', async () => {
      const { repository, userModel } = setup();
      const deleteOne = jest.fn().mockResolvedValue({ acknowledged: true });
      userModel.findById.mockReturnValue({
        select: jest.fn(),
        ...exec({ deleteOne }),
      });

      await expect(repository.deleteById('id-1')).resolves.toBe(true);
      expect(deleteOne).toHaveBeenCalled();
    });

    it('throws when the user does not exist', async () => {
      const { repository, userModel, exceptionService } = setup();
      userModel.findById.mockReturnValue({
        select: jest.fn(),
        ...exec(null),
      });

      await expect(repository.deleteById('id-1')).rejects.toThrow(
        HttpException,
      );
      expect(exceptionService.throw).toHaveBeenCalledWith(
        ExceptionStatusKeys.BadRequest,
        'User not found',
        expect.any(Array),
      );
    });
  });
});
