import { Injectable } from '@nestjs/common';

import { Response } from 'express';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import {
  compareToHash,
  hashText,
  UPDATABLE_USER_FIELDS,
  UPDATABLE_USER_SETTINGS_FIELDS,
} from '@steam-idler/server/auth/core';
import {
  AuthRepository,
  UserSettingsUpdateDto,
  UserUpdateDto,
} from '@steam-idler/server/auth/domain';
import {
  AuthExpectionKeys,
  ChangePasswordDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
  User,
  UserExceptionKeys,
} from '@steam-idler/server/auth/types';

import { AuthTokenService } from './auth-token.service';
import { AuthValidationService } from './auth-validation.service';

@Injectable()
export class AuthAccountService {
  constructor(
    private readonly exceptionService: ExceptionService,
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService,
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

  async deleteUser(user: User, response: Response) {
    const acknowledged = await this.authRepository.deleteById(String(user._id));
    if (!acknowledged) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Failed to delete user',
        [UserExceptionKeys.NotFound],
      );
    }
    return this.authTokenService.signOut(response);
  }

  async changePassword(user: User, dto: ChangePasswordDto, response: Response) {
    const userWithPassword = await this.authRepository.getById(
      String(user._id),
      true,
    );
    this.authValidationService.checkUserExistence(userWithPassword);

    const isOldPasswordValid = await compareToHash(
      dto.oldPassword,
      userWithPassword.password,
    );

    if (!isOldPasswordValid) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Old password is incorrect',
        [AuthExpectionKeys.InvalidOldPassword],
      );
    }

    if (dto.oldPassword === dto.newPassword) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'New password must differ from the old one',
        [AuthExpectionKeys.InvalidChangePassword],
      );
    }

    const hashedPassword = await hashText(dto.newPassword);
    const updated = await this.authRepository.updatePassword(
      String(user._id),
      hashedPassword,
    );
    this.authValidationService.checkUserExistence(updated);

    return this.authTokenService.signIn(updated.toObject<User>(), response);
  }

  async updateUser(user: User, dto: UpdateUserDto) {
    const sanitized: UserUpdateDto = {};
    for (const field of UPDATABLE_USER_FIELDS) {
      const value = dto[field];
      if (value !== undefined) {
        sanitized[field] = value;
      }
    }

    if (Object.keys(sanitized).length === 0) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'No fields provided to update',
        [AuthExpectionKeys.NoUpdateFieldsProvided],
      );
    }

    const updated = await this.authRepository.updateById(
      String(user._id),
      sanitized,
    );
    this.authValidationService.checkUserExistence(updated);
    return updated.toObject<User>();
  }

  async updateSettings(user: User, dto: UpdateUserSettingsDto) {
    const sanitized: UserSettingsUpdateDto = {};

    for (const field of UPDATABLE_USER_SETTINGS_FIELDS) {
      const value = dto[field];

      if (value !== undefined) {
        sanitized[field] = value;
      }
    }

    if (Object.keys(sanitized).length === 0) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'No settings provided to update',
        [AuthExpectionKeys.NoUpdateFieldsProvided],
      );
    }

    const updated = await this.authRepository.updateSettings(
      String(user._id),
      sanitized,
    );
    this.authValidationService.checkUserExistence(updated);

    return updated.toObject<User>();
  }
}
