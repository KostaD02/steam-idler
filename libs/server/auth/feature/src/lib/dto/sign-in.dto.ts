import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

import { USER_API_CONFIG } from '@steam-idler/server/auth/core';
import {
  AuthExpectionKeys,
  SignInDto as SignInDtoType,
} from '@steam-idler/server/auth/types';

export class SignInDto implements SignInDtoType {
  @ApiProperty({
    required: true,
    default: 'vigac@vigacashvili.ge',
  })
  @IsEmail({}, { message: AuthExpectionKeys.InvalidEmail })
  email!: string;

  @ApiProperty({
    required: true,
    default: 'Khinkali!123',
  })
  @IsString({
    message: AuthExpectionKeys.PasswordShouldBeString,
  })
  @MinLength(USER_API_CONFIG.PASSWORD_MIN_LENGTH, {
    message: AuthExpectionKeys.PasswordTooShort,
  })
  @MaxLength(USER_API_CONFIG.PASSWORD_MAX_LENGTH, {
    message: AuthExpectionKeys.PasswordTooLong,
  })
  password!: string;
}
