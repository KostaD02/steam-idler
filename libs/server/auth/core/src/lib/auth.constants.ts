export const AUTH_CONFIG = {
  SALT_ROUNDS: 10,
  ACCESS_TOKEN_KEY: 'access_token',
  ACCESS_TOKEN_COOKIE_EXP: 60 * 60 * 1000,
  REFRESH_TOKEN_EXP: '7d',
  REFRESH_TOKEN_KEY: 'refresh_token',
  REFRESH_TOKEN_COOKIE_EXP: 7 * 24 * 60 * 60 * 1000,
} as const;

export const USER_API_CONFIG = {
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 64,
} as const;

export const AUTH_TOKENS = {
  ROLE_KEY: Symbol('ROLES'),
  IS_PUBLIC: Symbol('IS_PUBLIC'),
} as const;

export const MFA_CONFIG = {
  ISSUER: 'Steam Idler',
  PENDING_TOKEN_KEY: 'mfa_pending_token',
  PENDING_TOKEN_EXP: '5m',
  PENDING_COOKIE_EXP: 5 * 60 * 1000,
  RECOVERY_CODE_COUNT: 10,
  RECOVERY_CODE_BYTES: 5,
  TOTP_WINDOW: 1,
} as const;

export const UPDATABLE_USER_FIELDS = ['displayName'] as const;
export type UpdatableUserField = (typeof UPDATABLE_USER_FIELDS)[number];

export const UPDATABLE_USER_SETTINGS_FIELDS = [
  'showProfileName',
  'showProfileImage',
  'maskAccountName',
] as const;
export type UpdatableUserSettingsField =
  (typeof UPDATABLE_USER_SETTINGS_FIELDS)[number];
