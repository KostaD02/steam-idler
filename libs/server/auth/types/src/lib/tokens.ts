// Make sure it matches auth.constants.ts

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export const TOKEN_SCOPES = {
  Access: 'access',
  Refresh: 'refresh',
  MfaPending: 'mfa-pending',
} as const;

export type TokenScope = (typeof TOKEN_SCOPES)[keyof typeof TOKEN_SCOPES];
