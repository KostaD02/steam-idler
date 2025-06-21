import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas';
import { AuthExceptionKeys, StatusExceptionKeys } from '../types';
import { ExpectionService } from './expection.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly expectionService: ExpectionService,
  ) {}

  async getUserDocument(name: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ name });

    if (!user) {
      this.expectionService.throwException(
        StatusExceptionKeys.NotFound,
        'User not found',
        AuthExceptionKeys.UserNotFound,
      );
    }

    return user;
  }
}
