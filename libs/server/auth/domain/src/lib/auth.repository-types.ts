import { UpdatableUserField } from '@steam-idler/server/auth/core';
import { BaseUser } from '@steam-idler/server/auth/types';

export type UserCreateDto = Pick<
  BaseUser,
  'displayName' | 'email' | 'password' | 'role' | 'steamAccounts'
>;

export type UserUpdateDto = Partial<Pick<BaseUser, UpdatableUserField>>;
