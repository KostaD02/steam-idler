import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength } from 'class-validator';

import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';
import {
  SteamAccountExceptionKeys,
  UpdateDisplayedGameNameDto as UpdateDisplayedGameNameDtoType,
} from '@steam-idler/server/steam-account/types';

export class UpdateDisplayedGameNameDto implements UpdateDisplayedGameNameDtoType {
  @ApiProperty({
    required: true,
    default: 'IdlingWithSteamIdler',
  })
  @IsString({
    message: SteamAccountExceptionKeys.DisplayedGameNameShouldBeString,
  })
  @MaxLength(STEAM_ACCOUNT_API_CONFIG.MAX_DISPLAYED_GAME_NAME_LENGTH, {
    message: SteamAccountExceptionKeys.DisplayedGameNameTooLong,
  })
  displayedGameName!: string;
}
