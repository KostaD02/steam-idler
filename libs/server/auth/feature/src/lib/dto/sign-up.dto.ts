import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

import { USER_API_CONFIG } from '@steam-idler/server/auth/core';
import {
  AuthExpectionKeys,
  SignUpDto as SignUpDtoType,
} from '@steam-idler/server/auth/types';

import { SignInDto } from './sign-in.dto';

export class SignUpDto extends SignInDto implements SignUpDtoType {
  @ApiProperty({
    required: true,
    default: 'InigoMontoya',
  })
  @IsString({
    message: AuthExpectionKeys.DisplayNameShouldBeString,
  })
  @MinLength(USER_API_CONFIG.DISPLAY_NAME_MIN_LENGTH, {
    message: AuthExpectionKeys.DisplayNameTooShort,
  })
  @MaxLength(USER_API_CONFIG.DISPLAY_NAME_MAX_LENGTH, {
    message: AuthExpectionKeys.DisplayNameTooLong,
  })
  displayName!: string;
}
