import { authenticator } from 'otplib';

import { MFA_CONFIG } from './auth.constants';

authenticator.options = { window: MFA_CONFIG.TOTP_WINDOW };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function getTotpAuthUrl(accountName: string, secret: string): string {
  return authenticator.keyuri(accountName, MFA_CONFIG.ISSUER, secret);
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
