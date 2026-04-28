import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, ValidatorProps } from 'mongoose';

import { MongoId, StrippedMongoObject } from '@steam-idler/server/infra/types';

import { USER_API_CONFIG } from '@steam-idler/server/auth/core';
import {
  BaseUser,
  UserRole,
  UserRoleEnum,
} from '@steam-idler/server/auth/types';

import { UserEmailValidator } from './auth.validator';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class UserEntity implements StrippedMongoObject<BaseUser> {
  @Prop({
    trim: true,
    required: true,
    minLength: USER_API_CONFIG.DISPLAY_NAME_MIN_LENGTH,
    maxLength: USER_API_CONFIG.DISPLAY_NAME_MAX_LENGTH,
  })
  displayName!: string;

  @Prop({
    unique: true,
    required: true,
    validators: [
      {
        name: UserEmailValidator.name,
        message: (props: ValidatorProps) =>
          `${props.value} is not a valid email!`,
        validator: (value: string) => UserEmailValidator.validator(value),
      },
    ],
  })
  email!: string;

  @Prop({
    required: true,
    select: false,
  })
  password!: string;

  @Prop({
    type: String,
    default: UserRoleEnum.Standard,
    enum: Object.values(UserRoleEnum),
  })
  role!: UserRole;

  @Prop({
    default: [],
    type: [String],
  })
  steamAccounts!: MongoId[];
}

export type UserDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);
