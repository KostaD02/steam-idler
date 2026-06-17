import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { EnvironmentService } from './environment.service';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_VERSION = 'v1';
const PAYLOAD_PARTS = 4;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly environmentService: EnvironmentService) {
    const secret = this.environmentService.get('CREDENTIALS_SECRET');

    if (!secret) {
      throw new Error(
        'CREDENTIALS_SECRET is not set. Generate one with `pnpm g:secret` and add it to your .env.',
      );
    }

    this.key = createHash('sha256').update(secret).digest();
  }

  encrypt(value: string): string {
    if (!value) {
      return value;
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      ENCRYPTION_VERSION,
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  decrypt(value: string): string {
    if (!value || !value.startsWith(`${ENCRYPTION_VERSION}:`)) {
      return value;
    }

    const parts = value.split(':');

    if (parts.length !== PAYLOAD_PARTS) {
      return value;
    }

    const [, ivHex, authTagHex, encryptedHex] = parts;
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  encryptList(values: string[]): string[] {
    return values.map((value) => this.encrypt(value));
  }

  decryptList(values: string[]): string[] {
    return values.map((value) => this.decrypt(value));
  }
}
