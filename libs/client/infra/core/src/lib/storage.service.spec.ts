import { TestBed } from '@angular/core/testing';

import {
  BaseStorageService,
  LocalStorageService,
  SessionStorageService,
} from './storage.service';

const setupLocal = () => {
  TestBed.configureTestingModule({});
  const service = TestBed.inject(LocalStorageService);

  return { service };
};

describe('LocalStorageService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('setItem / getItem', () => {
    it('round-trips a serialised value', () => {
      const { service } = setupLocal();

      service.setItem('key', { a: 1 });

      expect(service.getItem('key')).toEqual({ a: 1 });
    });

    it('persists the value as JSON in the underlying storage', () => {
      const { service } = setupLocal();

      service.setItem('key', 'value');

      expect(window.localStorage.getItem('key')).toBe('"value"');
    });

    it('returns null when the key is absent', () => {
      const { service } = setupLocal();

      expect(service.getItem('missing')).toBeNull();
    });

    it('returns null when the stored value is not valid JSON', () => {
      const { service } = setupLocal();
      window.localStorage.setItem('broken', '{not-json');

      expect(service.getItem('broken')).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('deletes the stored value', () => {
      const { service } = setupLocal();
      service.setItem('key', 'value');

      service.removeItem('key');

      expect(service.getItem('key')).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes every stored value', () => {
      const { service } = setupLocal();
      service.setItem('a', 1);
      service.setItem('b', 2);

      service.clear();

      expect(service.getItem('a')).toBeNull();
      expect(service.getItem('b')).toBeNull();
    });
  });

  describe('encrypted items', () => {
    it('round-trips an encoded value', () => {
      const { service } = setupLocal();

      service.setEncryptedItem('secret', { token: 'abc' });

      expect(service.getEncodedItem('secret')).toEqual({ token: 'abc' });
    });

    it('does not store anything when the key is empty', () => {
      const { service } = setupLocal();

      service.setEncryptedItem('', 'value');

      expect(window.localStorage.length).toBe(0);
    });

    it('returns null when reading with an empty key', () => {
      const { service } = setupLocal();

      expect(service.getEncodedItem('')).toBeNull();
    });

    it('returns null when the encoded value cannot be decoded', () => {
      const { service } = setupLocal();
      window.localStorage.setItem('secret', 'not-base64-$$$');

      expect(service.getEncodedItem('secret')).toBeNull();
    });
  });
});

describe('SessionStorageService', () => {
  it('reads back through the session storage', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(SessionStorageService);
    window.sessionStorage.clear();

    service.setItem('key', 42);

    expect(service.getItem('key')).toBe(42);
  });
});

class MemoryStorageService extends BaseStorageService {
  constructor() {
    super('unsupported-storage');
  }
}

describe('BaseStorageService memory fallback', () => {
  it('falls back to in-memory storage when the token is unsupported', () => {
    const service = new MemoryStorageService();

    service.setItem('key', 'value');

    expect(service.getItem('key')).toBe('value');
  });
});
