import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

import { USER_API_CONFIG } from '@steam-idler/server/auth/core';
import {
  AuthExpectionKeys,
  ChangePasswordDto as ChangePasswordDtoType,
} from '@steam-idler/server/auth/types';

export class ChangePasswordDto implements ChangePasswordDtoType {
  @ApiProperty({
    required: true,
    default: 'Khinkali!123',
  })
  @IsString({
    message: AuthExpectionKeys.OldPasswordShouldBeString,
  })
  @MinLength(USER_API_CONFIG.PASSWORD_MIN_LENGTH, {
    message: AuthExpectionKeys.OldPasswordTooShort,
  })
  @MaxLength(USER_API_CONFIG.PASSWORD_MAX_LENGTH, {
    message: AuthExpectionKeys.OldPasswordTooLong,
  })
  oldPassword!: string;

  @ApiProperty({
    required: true,
    default: 'Khinkali!1234',
  })
  @IsString({
    message: AuthExpectionKeys.NewPasswordShouldBeString,
  })
  @MinLength(USER_API_CONFIG.PASSWORD_MIN_LENGTH, {
    message: AuthExpectionKeys.NewPasswordTooShort,
  })
  @MaxLength(USER_API_CONFIG.PASSWORD_MAX_LENGTH, {
    message: AuthExpectionKeys.NewPasswordTooLong,
  })
  newPassword!: string;
}
