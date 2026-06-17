import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

import { MongoId, StrippedMongoObject } from '@steam-idler/server/infra/types';

import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';
import {
  SteamAccount,
  SteamAccountCredentials,
  SteamAccountIdleSettings,
  SteamAccountProfile,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SteamAccountEntity implements StrippedMongoObject<SteamAccount> {
  @Prop({
    required: true,
    type: Types.ObjectId,
  })
  userId!: MongoId;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  accountName!: string;

  @Prop({
    required: false,
    trim: true,
    default: '',
    minLength: STEAM_ACCOUNT_API_CONFIG.MIN_DISPLAYED_GAME_NAME_LENGTH,
    maxLength: STEAM_ACCOUNT_API_CONFIG.MAX_DISPLAYED_GAME_NAME_LENGTH,
  })
  displayedGameName!: string;

  @Prop({
    _id: false,
    required: true,
    type: {
      name: {
        type: String,
        default: '',
      },
      avatarUrl: {
        type: String,
        default: '',
      },
    },
  })
  profile!: SteamAccountProfile;

  @Prop({
    _id: false,
    required: true,
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
        _id: false,
        required: true,
        type: {
          enabled: {
            type: Boolean,
            default: false,
          },
          whileIdling: {
            type: Boolean,
            default: false,
          },
          template: {
            type: String,
            default: '',
          },
        },
      },
    },
  })
  idleSettings!: SteamAccountIdleSettings;

  @Prop({
    _id: false,
    required: true,
    type: {
      id: {
        type: String,
        default: '',
      },
      cookies: {
        type: [String],
        default: [],
      },
      refreshToken: {
        type: String,
        default: '',
      },
    },
  })
  credentials!: SteamAccountCredentials;
}

export type SteamAccountDocument = HydratedDocument<SteamAccountEntity>;
export const SteamAccountSchema =
  SchemaFactory.createForClass(SteamAccountEntity);
