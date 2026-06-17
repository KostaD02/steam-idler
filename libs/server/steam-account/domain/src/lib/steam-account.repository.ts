import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  Cacheable,
  CacheEvict,
  CacheRepository,
  buildCacheKey,
} from '@steam-idler/server/infra/cache';
import { ExceptionService } from '@steam-idler/server/infra/services';
import {
  ExceptionStatusKeys,
  MongoId,
  StrippedMongoObject,
} from '@steam-idler/server/infra/types';

import {
  SteamAccount,
  SteamAccountExceptionKeys,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

import {
  SteamAccountDocument,
  SteamAccountEntity,
} from './steam-account.schema';

@Injectable()
@CacheRepository()
export class SteamAccountRepository {
  constructor(
    @InjectModel(SteamAccountEntity.name)
    private readonly steamAccountModel: Model<SteamAccountEntity>,
    private readonly exceptionService: ExceptionService,
  ) {}

  getAll() {
    return this.steamAccountModel.find({}).exec();
  }

  getById(id: string) {
    return this.steamAccountModel.findById(id).exec();
  }

  @Cacheable({ key: (args) => buildCacheKey('user', String(args[0])) })
  async getByUserId(id: MongoId) {
    const accounts = await this.steamAccountModel
      .find({ userId: id })
      .select('-credentials')
      .lean()
      .exec();

    return accounts.map((account) => ({
      ...account,
      profile: account.profile ?? { name: '', avatarUrl: '' },
    }));
  }

  getByName(accountName: string) {
    return this.steamAccountModel.findOne({ accountName }).exec();
  }

  existsByName(accountName: string) {
    return this.steamAccountModel.exists({ accountName });
  }

  @CacheEvict({ keys: [(args) => buildCacheKey('user', String(args[1]))] })
  create(accountName: string, userId: MongoId) {
    const steamAccount: StrippedMongoObject<SteamAccount> = {
      userId,
      accountName,
      displayedGameName: '',
      profile: {
        name: '',
        avatarUrl: '',
      },
      credentials: {
        id: '',
        cookies: [],
        refreshToken: '',
      },
      idleSettings: {
        idleEnabled: false,
        personaStatus: SteamPersonaStatusEnum.Online,
        idleGameIds: [],
        autoReply: {
          enabled: false,
          template: '',
          whileIdling: false,
        },
      },
    };
    return this.steamAccountModel.create(steamAccount);
  }

  updateById(
    id: string,
    steamAccount: Partial<StrippedMongoObject<SteamAccount>>,
  ) {
    return this.steamAccountModel.findByIdAndUpdate(id, steamAccount);
  }

  // Method to evict cache for a user via decorator
  @CacheEvict({ keys: [(args) => buildCacheKey('user', String(args[0]))] })
  evictUserAccounts(_userId: MongoId): Promise<void> {
    return Promise.resolve();
  }

  async deleteById(id: string) {
    const steamAccount = await this.getById(id);
    this.checkSteamAccountExists(steamAccount);
    const deleteAction = await steamAccount.deleteOne().exec();
    return {
      success: deleteAction.acknowledged,
    };
  }

  async deleteByAccountName(accountName: string) {
    const steamAccount = await this.getByName(accountName);
    this.checkSteamAccountExists(steamAccount);
    const deleteAction = await steamAccount.deleteOne().exec();
    return {
      success: deleteAction.acknowledged,
    };
  }

  private checkSteamAccountExists(
    steamAccount: SteamAccountDocument | null,
  ): asserts steamAccount is SteamAccountDocument {
    if (!steamAccount) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }
  }
}
