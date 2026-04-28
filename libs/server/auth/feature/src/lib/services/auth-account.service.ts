import { Injectable } from '@nestjs/common';

import { compareToHash } from '@steam-idler/server/auth/core';
import { AuthRepository } from '@steam-idler/server/auth/domain';
import { User } from '@steam-idler/server/auth/types';

import { AuthValidationService } from './auth-validation.service';

@Injectable()
export class AuthAccountService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.authRepository.getByEmail(email, true);
    this.authValidationService.checkUserExistence(user, true);
    const isPasswordValid = await compareToHash(password, user.password);
    const { password: _, ...safeUser } = user.toObject();
    return isPasswordValid ? safeUser : null;
  }

  async getSerializedUser(payload: User) {
    const user = await this.authRepository.getById(String(payload._id));
    this.authValidationService.checkUserExistence(user);
    return user.toObject<User>();
  }
}
