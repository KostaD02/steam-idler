import { BaseUser } from '@steam-idler/server/auth/types';

export type UserCreateDto = Pick<
  BaseUser,
  'displayName' | 'email' | 'password' | 'role' | 'steamAccounts'
>;
