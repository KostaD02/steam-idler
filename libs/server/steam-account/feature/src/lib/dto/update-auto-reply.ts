import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsString, MaxLength } from 'class-validator';

import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';
import {
  SteamAccountExceptionKeys,
  UpdateAutoReplyDto as UpdateAutoReplyDtoType,
} from '@steam-idler/server/steam-account/types';

export class UpdateAutoReplyDto implements UpdateAutoReplyDtoType {
  @ApiProperty({
    required: true,
    default: "I'm away right now - this is an automatic reply.",
  })
  @IsString({
    message: SteamAccountExceptionKeys.AutoReplyTemplateShouldBeString,
  })
  @MaxLength(STEAM_ACCOUNT_API_CONFIG.MAX_AUTO_REPLY_TEMPLATE_LENGTH, {
    message: SteamAccountExceptionKeys.AutoReplyTemplateTooLong,
  })
  template!: string;

  @ApiProperty({
    required: true,
    default: false,
  })
  @IsBoolean({
    message: SteamAccountExceptionKeys.AutoReplyWhileIdlingShouldBeBoolean,
  })
  whileIdling!: boolean;
}
