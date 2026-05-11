import { SteamPersonaStatus } from './steam-persona-status';

export interface SteamAccountAutoReplySettings {
  /** Whether incoming chat messages get an automatic reply. */
  enabled: boolean;
  /** When true, only auto-reply while the account is actively idling games. */
  whileIdling: boolean;
  /** Message body sent as the auto-reply. */
  template: string;
}

export interface SteamAccountIdleSettings {
  /** Master switch when false, the account stays logged in but idles no games. */
  idleEnabled: boolean;
  /** Steam app IDs the account should appear to be playing. */
  idleGameIds: number[];
  /** Online presence shown to friends (Online, Away, Invisible, etc.). */
  personaStatus: SteamPersonaStatus;
  /** Auto-reply behavior for incoming chat messages. */
  autoReply: SteamAccountAutoReplySettings;
}
