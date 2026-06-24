import { EncryptionService } from './encryption.service';
import { EnvironmentService } from './environment.service';

const buildEnvStub = (secret: string | undefined) =>
  ({ get: jest.fn().mockReturnValue(secret) }) as unknown as EnvironmentService;

const setup = () => {
  const environmentService = buildEnvStub('super-secret-value');
  const service = new EncryptionService(environmentService);

  return { service, environmentService };
};

describe('EncryptionService', () => {
  it('throws when CREDENTIALS_SECRET is missing', () => {
    expect(() => new EncryptionService(buildEnvStub(undefined))).toThrow(
      'CREDENTIALS_SECRET is not set',
    );
  });

  describe('encrypt', () => {
    it('returns a versioned four-part payload', () => {
      const { service } = setup();

      const parts = service.encrypt('hello').split(':');

      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('v1');
    });

    it('produces different ciphertext on each call for the same input', () => {
      const { service } = setup();

      expect(service.encrypt('hello')).not.toBe(service.encrypt('hello'));
    });

    it('passes empty values through untouched', () => {
      const { service } = setup();

      expect(service.encrypt('')).toBe('');
    });
  });

  describe('decrypt', () => {
    it('round-trips an encrypted value back to the original', () => {
      const { service } = setup();

      const encrypted = service.encrypt('my-refresh-token');

      expect(service.decrypt(encrypted)).toBe('my-refresh-token');
    });

    it('returns non-versioned values as-is', () => {
      const { service } = setup();

      expect(service.decrypt('plain-text')).toBe('plain-text');
    });

    it('returns malformed versioned payloads as-is', () => {
      const { service } = setup();

      expect(service.decrypt('v1:only:three')).toBe('v1:only:three');
    });
  });

  describe('list helpers', () => {
    it('encrypts and decrypts a list round-trip', () => {
      const { service } = setup();
      const values = ['cookie-a', 'cookie-b', 'cookie-c'];

      const decrypted = service.decryptList(service.encryptList(values));

      expect(decrypted).toEqual(values);
    });
  });
});
