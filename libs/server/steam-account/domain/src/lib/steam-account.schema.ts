import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

import { StrippedMongoObject } from '@steam-idler/server/infra/types';

import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';
import {
  SteamAccount,
  SteamAccountCredentials,
  SteamAccountIdleSettings,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SteamAccountEntity implements StrippedMongoObject<SteamAccount> {
  @Prop({
    required: false,
    trim: true,
    default: '',
    minLength: STEAM_ACCOUNT_API_CONFIG.MIN_DISPLAYED_GAME_NAME_LENGTH,
    maxLength: STEAM_ACCOUNT_API_CONFIG.MAX_DISPLAYED_GAME_NAME_LENGTH,
  })
  displayedGameName!: string;

  @Prop({
    type: {
      idleEnabled: {
        type: Boolean,
        default: true,
      },
      idleGameIds: {
        type: [Number],
        default: [],
      },
      personaStatus: {
        type: Number,
        default: SteamPersonaStatusEnum.Online,
      },
      autoReply: {
        type: Object,
        default: {
          enabled: false,
          whileIdling: false,
          template: '',
        },
      },
    },
  })
  idleSettings!: SteamAccountIdleSettings;

  @Prop({
    required: true,
    type: {
      id: {
        type: String,
        required: true,
      },
      cookies: {
        type: [String],
        required: true,
      },
      refreshToken: {
        type: String,
        required: true,
      },
    },
  })
  credentials!: SteamAccountCredentials;
}

export type SteamAccountDocument = HydratedDocument<SteamAccountEntity>;
export const SteamAccountSchema =
  SchemaFactory.createForClass(SteamAccountEntity);
