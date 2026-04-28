import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { UserExceptionKeys } from '@steam-idler/server/auth/types';

import { UserCreateDto } from './auth.repository-types';
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

  getAll() {
    return this.userModel.find({}).lean().exec();
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
