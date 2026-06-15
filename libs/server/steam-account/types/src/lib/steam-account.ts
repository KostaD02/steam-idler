import { MongoId, MongoObject } from '@steam-idler/server/infra/types';

import { SteamAccountCredentials } from './steam-account-credentials';
import { SteamAccountIdleSettings } from './steam-account-idle-settings';

export interface SteamAccount extends MongoObject {
  /** User id who owns this account */
  userId: MongoId;
  /** Steam account name used to sign in (Steam's `accountName`). Unique. */
  accountName: string;
  /** Custom string shown under the account's name in friends list while idling (maps to Steam's `gameExtraInfo`). */
  displayedGameName: string;
  /** User-controlled idle behavior: which games to idle, persona status, auto-reply, etc. */
  idleSettings: SteamAccountIdleSettings;
  /** Auth material used to log in and maintain the Steam session. */
  credentials: SteamAccountCredentials;
}

export type SteamAccountSummary = Omit<SteamAccount, 'credentials'>;
