import { randomBytes } from 'node:crypto';

import { MFA_CONFIG } from './auth.constants';

export function generateRecoveryCodes(
  count: number = MFA_CONFIG.RECOVERY_CODE_COUNT,
): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(MFA_CONFIG.RECOVERY_CODE_BYTES).toString('hex'),
  );
}

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toLowerCase().replace(/[\s-]/g, '');
}
