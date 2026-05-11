import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { ExceptionService } from '@steam-idler/server/infra/services';

import { SteamAccountCredentials } from '@steam-idler/server/steam-account/types';

import { SteamAccountEntity } from './steam-account.schema';

@Injectable()
export class SteamAccountRepository {
  constructor(
    @InjectModel(SteamAccountEntity.name)
    private readonly steamAccountModel: Model<SteamAccountEntity>,
    private readonly exceptionService: ExceptionService,
  ) {}

  create(steamCredentials: SteamAccountCredentials) {
    return this.steamAccountModel.create({
      credentials: steamCredentials,
    });
  }

  // TODO: finish rest methods
}
