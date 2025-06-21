import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas';
import {
  AuthExceptionKeys,
  StatusExceptionKeys,
  UserPersonaState,
} from '../types';
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

  async getUsers() {
    const users = await this.userModel.find({
      steamID: { $exists: true, $ne: '' },
    });

    return users.map((user) => this.userData(user));
  }

  async getUserByName(name: string) {
    const user = await this.userModel.findOne({ name });

    if (!user) {
      return null;
    }

    return this.userData(user);
  }

  private userData(user: UserDocument): {
    name: string;
    idleGames: boolean;
    personaState: UserPersonaState;
    gameIds: number[];
    replyMessageTemplate: string;
    replyMessageWhileIdle: boolean;
    gameExtraInfo: string;
  } {
    return {
      name: user.name,
      idleGames: user.idleGames,
      personaState: user.personaState,
      gameIds: user.gameIds,
      replyMessageTemplate: user.replyMessageTemplate,
      replyMessageWhileIdle: user.replyMessageWhileIdle,
      gameExtraInfo: user.gameExtraInfo,
    };
  }
}
