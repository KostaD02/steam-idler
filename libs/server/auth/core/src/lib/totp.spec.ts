import { authenticator } from 'otplib';

import { MFA_CONFIG } from './auth.constants';
import { generateTotpSecret, getTotpAuthUrl, verifyTotp } from './totp';

describe('generateTotpSecret', () => {
  it('produces a non-empty base32 secret', () => {
    expect(generateTotpSecret()).toMatch(/^[A-Z2-7]+$/);
  });

  it('produces a different secret on each call', () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});

describe('getTotpAuthUrl', () => {
  it('builds an otpauth url carrying the issuer and secret', () => {
    const url = getTotpAuthUrl('user@example.com', 'SECRET123');

    expect(url).toContain('otpauth://totp/');
    expect(url).toContain('secret=SECRET123');
    expect(url).toContain(`issuer=${encodeURIComponent(MFA_CONFIG.ISSUER)}`);
  });
});

describe('verifyTotp', () => {
  it('accepts a freshly generated token', () => {
    const secret = generateTotpSecret();
    const token = authenticator.generate(secret);

    expect(verifyTotp(secret, token)).toBe(true);
  });

  it('rejects an incorrect token', () => {
    const secret = generateTotpSecret();
    const valid = authenticator.generate(secret);
    const wrong = valid === '000000' ? '111111' : '000000';

    expect(verifyTotp(secret, wrong)).toBe(false);
  });

  it('returns false when verification throws', () => {
    expect(verifyTotp('', '')).toBe(false);
  });
});
