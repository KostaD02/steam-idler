import { ApiProperty } from '@nestjs/swagger';

import { IsIn } from 'class-validator';

import {
  SteamAccountExceptionKeys,
  SteamPersonaStatus,
  SteamPersonaStatusEnum,
  UpdatePersonaDto as UpdatePersonaDtoType,
} from '@steam-idler/server/steam-account/types';

const PERSONA_STATUS_VALUES = Object.values(SteamPersonaStatusEnum);

export class UpdatePersonaDto implements UpdatePersonaDtoType {
  @ApiProperty({
    required: true,
    enum: PERSONA_STATUS_VALUES,
    default: SteamPersonaStatusEnum.Online,
  })
  @IsIn(PERSONA_STATUS_VALUES, {
    message: SteamAccountExceptionKeys.InvalidPersonaStatus,
  })
  personaStatus!: SteamPersonaStatus;
}
