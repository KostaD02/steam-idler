import { ApiProperty } from '@nestjs/swagger';

import { IsArray, IsNumber } from 'class-validator';

import {
  GamesToIdleDto as GamesToIdleDtoType,
  SteamAccountExceptionKeys,
} from '@steam-idler/server/steam-account/types';

export class GamesToIdleDto implements GamesToIdleDtoType {
  @ApiProperty({
    required: true,
    default: [1245620, 2622380],
  })
  @IsArray({ message: SteamAccountExceptionKeys.GamesIdsShouldBeArray })
  @IsNumber(
    {},
    { each: true, message: SteamAccountExceptionKeys.GamesIdsMustBeNumbers },
  )
  gamesIds!: number[];
}
