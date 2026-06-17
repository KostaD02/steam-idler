import {
  UpdatableUserField,
  UpdatableUserSettingsField,
} from '@steam-idler/server/auth/core';
import { BaseUser, UserSettings } from '@steam-idler/server/auth/types';

export type UserCreateDto = Pick<
  BaseUser,
  'displayName' | 'email' | 'password' | 'role' | 'steamAccounts'
>;

export type UserUpdateDto = Partial<Pick<BaseUser, UpdatableUserField>>;

export type UserSettingsUpdateDto = Partial<
  Pick<UserSettings, UpdatableUserSettingsField>
>;
