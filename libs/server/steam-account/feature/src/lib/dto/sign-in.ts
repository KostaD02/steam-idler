import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';
import {
  SteamAccountExceptionKeys,
  SteamSignInDto as SteamSignInDtoType,
} from '@steam-idler/server/steam-account/types';

export class SteamSignInDto implements SteamSignInDtoType {
  @ApiProperty({
    required: true,
    default: 'JohnDoe',
  })
  @IsString({ message: SteamAccountExceptionKeys.LoginShouldBeString })
  login!: string;

  @ApiProperty({
    required: true,
    default: 'Khinkali!123',
  })
  @IsString({ message: SteamAccountExceptionKeys.PasswordShouldBeString })
  password!: string;

  @ApiProperty({
    required: true,
    default: '12345',
  })
  @IsString({ message: SteamAccountExceptionKeys.TwoFactorCodeShouldBeString })
  @MinLength(STEAM_ACCOUNT_API_CONFIG.MIN_TWO_FACTOR_CODE_LENGTH, {
    message: SteamAccountExceptionKeys.TwoFactorCodeTooShort,
  })
  @MaxLength(STEAM_ACCOUNT_API_CONFIG.MAX_TWO_FACTOR_CODE_LENGTH, {
    message: SteamAccountExceptionKeys.TwoFactorCodeTooLong,
  })
  twoFactorCode!: string;
}
