import { Injectable } from '@nestjs/common';
import {
  ExpectionService,
  UserService as UserDocumentService,
} from 'src/shared/services';
import { StatusExceptionKeys, AuthExceptionKeys } from 'src/shared/types';

@Injectable()
export class UserService {
  constructor(
    private readonly userDocumentService: UserDocumentService,
    private readonly expectionService: ExpectionService,
  ) {}

  async getUsers() {
    return this.userDocumentService.getUsers();
  }

  async getUserByName(name: string) {
    const user = await this.userDocumentService.getUserByName(name);

    if (!user) {
      this.expectionService.throwException(
        StatusExceptionKeys.BadRequest,
        'User not found',
        AuthExceptionKeys.UserNotFound,
        true,
      );
    }

    return user;
  }
}
