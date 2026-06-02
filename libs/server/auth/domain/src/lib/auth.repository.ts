import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { getISOString } from '@steam-idler/infra';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys, MongoId } from '@steam-idler/server/infra/types';

import { UserExceptionKeys } from '@steam-idler/server/auth/types';

import { UserCreateDto, UserUpdateDto } from './auth.repository-types';
import { UserDocument, UserEntity } from './auth.schema';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly exceptionService: ExceptionService,
  ) {}

  userCount() {
    return this.userModel.countDocuments({}).exec();
  }

  getByEmail(email: string, includePassword = false) {
    const query = this.userModel.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  getById(id: string, includePassword = false) {
    const query = this.userModel.findById(id);
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  emailExists(email: string) {
    return this.userModel.exists({ email }).exec();
  }

  create(dto: UserCreateDto) {
    return this.userModel.create(dto);
  }

  updateById(id: string, dto: UserUpdateDto) {
    return this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  pushSteamAccount(userId: MongoId, steamAccountId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { steamAccounts: steamAccountId } },
        { new: true },
      )
      .exec();
  }

  pullSteamAccount(userId: MongoId, steamAccountId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { steamAccounts: steamAccountId } },
        { new: true },
      )
      .exec();
  }

  updatePassword(id: string, hashedPassword: string) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          password: hashedPassword,
          passwordChangedAt: getISOString(),
        },
        { new: true },
      )
      .exec();
  }

  async deleteById(id: string) {
    const user = await this.getById(id);

    if (!user) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'User not found',
        [UserExceptionKeys.NotFound],
      );
    }

    const action = await user?.deleteOne();
    return action.acknowledged;
  }
}
