import { MongoId, MongoObject } from '@steam-idler/server/infra/types';

import { UserRole } from './role';
import { UserSettings } from './user-settings';

export interface BaseUser extends MongoObject {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  steamAccounts: MongoId[];
  passwordChangedAt: string;
  settings: UserSettings;
}

export type UserNotSelectedFields = 'password';

export type User = Omit<BaseUser, UserNotSelectedFields>;

export interface AuthenticatedUser extends BaseUser {
  iat: number;
  exp: number;
}
