import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

import {
  AuthExpectionKeys,
  MfaTokenDto as MfaTokenDtoType,
} from '@steam-idler/server/auth/types';

export class MfaTokenDto implements MfaTokenDtoType {
  @ApiProperty({
    required: true,
    description: 'A 6-digit authenticator code or a recovery code.',
    default: '123456',
  })
  @IsString({ message: AuthExpectionKeys.MfaCodeRequired })
  @MinLength(6, { message: AuthExpectionKeys.MfaInvalidCode })
  @MaxLength(64, { message: AuthExpectionKeys.MfaInvalidCode })
  token!: string;
}
