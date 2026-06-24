import { Cache } from 'cache-manager';

import { CACHE_PREFIX_KEY, CACHE_SEPARATOR } from './cache.const';
import { CacheService } from './cache.service';

const setup = () => {
  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
  };
  const service = new CacheService(cache as unknown as Cache);

  return { service, cache };
};

const prefixed = (...parts: string[]) =>
  [CACHE_PREFIX_KEY, ...parts].join(CACHE_SEPARATOR);

describe('CacheService', () => {
  it('exposes the configured prefix and separator', () => {
    const { service } = setup();

    expect(service.keyPrefix).toBe(CACHE_PREFIX_KEY);
    expect(service.keySeparator).toBe(CACHE_SEPARATOR);
  });

  describe('buildKey', () => {
    it('prefixes the supplied key parts', () => {
      const { service } = setup();

      expect(service.buildKey('users', 'user-id')).toBe(
        prefixed('users', 'user-id'),
      );
    });
  });

  describe('get', () => {
    it('reads from the cache using the prefixed key', async () => {
      const { service, cache } = setup();
      cache.get.mockResolvedValue('value');

      await expect(service.get('users')).resolves.toBe('value');
      expect(cache.get).toHaveBeenCalledWith(prefixed('users'));
    });
  });

  describe('set', () => {
    it('writes to the cache using the prefixed key and ttl', async () => {
      const { service, cache } = setup();
      cache.set.mockResolvedValue('value');

      await service.set('users', 'value', 1000);

      expect(cache.set).toHaveBeenCalledWith(prefixed('users'), 'value', 1000);
    });
  });

  describe('del', () => {
    it('deletes the prefixed key', async () => {
      const { service, cache } = setup();
      cache.del.mockResolvedValue(true);

      await expect(service.del('users')).resolves.toBe(true);
      expect(cache.del).toHaveBeenCalledWith(prefixed('users'));
    });
  });

  describe('clear', () => {
    it('clears the whole cache', async () => {
      const { service, cache } = setup();
      cache.clear.mockResolvedValue(true);

      await expect(service.clear()).resolves.toBe(true);
      expect(cache.clear).toHaveBeenCalledWith();
    });
  });
});
