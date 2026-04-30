import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { USER_API_CONFIG } from '@steam-idler/server/auth/core';
import {
  AuthExpectionKeys,
  UpdateUserDto as UpdateUserDtoType,
} from '@steam-idler/server/auth/types';

export class UpdateUserDto implements UpdateUserDtoType {
  @ApiProperty({
    required: false,
    default: 'InigoMontoya',
  })
  @IsOptional()
  @IsString({
    message: AuthExpectionKeys.DisplayNameShouldBeString,
  })
  @MinLength(USER_API_CONFIG.DISPLAY_NAME_MIN_LENGTH, {
    message: AuthExpectionKeys.DisplayNameTooShort,
  })
  @MaxLength(USER_API_CONFIG.DISPLAY_NAME_MAX_LENGTH, {
    message: AuthExpectionKeys.DisplayNameTooLong,
  })
  displayName?: string;
}
