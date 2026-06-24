import { MFA_CONFIG } from './auth.constants';
import { generateRecoveryCodes, normalizeRecoveryCode } from './recovery-codes';

describe('generateRecoveryCodes', () => {
  it('generates the configured number of hex codes by default', () => {
    const codes = generateRecoveryCodes();

    expect(codes).toHaveLength(MFA_CONFIG.RECOVERY_CODE_COUNT);
    codes.forEach((code) => {
      expect(code).toMatch(/^[0-9a-f]+$/);
    });
  });

  it('honours an explicit count', () => {
    expect(generateRecoveryCodes(3)).toHaveLength(3);
  });

  it('generates unique codes', () => {
    const codes = generateRecoveryCodes(10);

    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('normalizeRecoveryCode', () => {
  it('trims, lowercases and strips spaces and hyphens', () => {
    expect(normalizeRecoveryCode('  AB-CD EF  ')).toBe('abcdef');
  });

  it('leaves an already-normalized code untouched', () => {
    expect(normalizeRecoveryCode('abcdef')).toBe('abcdef');
  });
});
