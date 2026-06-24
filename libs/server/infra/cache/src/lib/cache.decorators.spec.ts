import 'reflect-metadata';

import { CACHE_PREFIX_KEY, CACHE_SEPARATOR } from './cache.const';
import {
  CACHE_PREFIX_METADATA,
  Cacheable,
  CacheEvict,
  CacheRepository,
} from './cache.decorators';
import { CacheRegistry } from './cache.registry';
import { CacheService } from './cache.service';

const buildCacheStub = () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(true),
});

const registerCache = (cache: ReturnType<typeof buildCacheStub>) => {
  const env = { get: jest.fn().mockReturnValue('2') };
  CacheRegistry.register(cache as unknown as CacheService, env as never);

  return { env };
};

describe('cache.decorators', () => {
  describe('CacheRepository', () => {
    it('stores the explicit prefix as metadata', () => {
      @CacheRepository('accounts')
      class Repo {}

      expect(Reflect.getMetadata(CACHE_PREFIX_METADATA, Repo)).toBe('accounts');
    });

    it('falls back to the class name when no prefix is given', () => {
      @CacheRepository()
      class UserRepo {}

      expect(Reflect.getMetadata(CACHE_PREFIX_METADATA, UserRepo)).toBe(
        'UserRepo',
      );
    });
  });

  describe('Cacheable', () => {
    it('returns the cached value without invoking the original method', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockResolvedValue('cached-value');
      const inner = jest.fn().mockResolvedValue('fresh-value');

      @CacheRepository('users')
      class Repo {
        @Cacheable({ key: 'all' })
        async load(): Promise<string> {
          return inner();
        }
      }

      const result = await new Repo().load();

      expect(result).toBe('cached-value');
      expect(inner).not.toHaveBeenCalled();
      expect(cache.get).toHaveBeenCalledWith(`users${CACHE_SEPARATOR}all`);
    });

    it('invokes the original and caches the result on a miss', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockResolvedValue(undefined);
      const inner = jest.fn().mockResolvedValue('fresh-value');

      @CacheRepository('users')
      class Repo {
        @Cacheable({ key: 'all', ttl: 1000 })
        async load(): Promise<string> {
          return inner();
        }
      }

      const result = await new Repo().load();

      expect(result).toBe('fresh-value');
      expect(inner).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        `users${CACHE_SEPARATOR}all`,
        'fresh-value',
        1000,
      );
    });

    it('does not cache a null result', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockResolvedValue(undefined);

      @CacheRepository('users')
      class Repo {
        @Cacheable({ key: 'all' })
        async load(): Promise<null> {
          return null;
        }
      }

      const result = await new Repo().load();

      expect(result).toBeNull();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('builds the key from a generator using the call arguments', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockResolvedValue(undefined);

      @CacheRepository('users')
      class Repo {
        @Cacheable({ key: (args) => `user${CACHE_SEPARATOR}${args[0]}` })
        async load(id: string): Promise<string> {
          return `value-${id}`;
        }
      }

      await new Repo().load('42');

      expect(cache.set).toHaveBeenCalledWith(
        `users${CACHE_SEPARATOR}user${CACHE_SEPARATOR}42`,
        'value-42',
        undefined,
      );
    });

    it('still returns the result when the cache read throws', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockRejectedValue(new Error('read down'));
      const inner = jest.fn().mockResolvedValue('fresh-value');

      @CacheRepository('users')
      class Repo {
        @Cacheable({ key: 'all' })
        async load(): Promise<string> {
          return inner();
        }
      }

      await expect(new Repo().load()).resolves.toBe('fresh-value');
      expect(inner).toHaveBeenCalledTimes(1);
    });

    it('still returns the result when the cache write throws', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockResolvedValue(undefined);
      cache.set.mockRejectedValue(new Error('write down'));

      @CacheRepository('users')
      class Repo {
        @Cacheable({ key: 'all' })
        async load(): Promise<string> {
          return 'fresh-value';
        }
      }

      await expect(new Repo().load()).resolves.toBe('fresh-value');
    });

    it('throws when the class is missing @CacheRepository', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.get.mockResolvedValue(undefined);

      class Repo {
        @Cacheable({ key: 'all' })
        async load(): Promise<string> {
          return 'fresh-value';
        }
      }

      await expect(new Repo().load()).rejects.toThrow(
        'is missing @CacheRepository()',
      );
    });
  });

  describe('CacheEvict', () => {
    it('runs the original method and deletes the configured keys', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      const inner = jest.fn().mockResolvedValue('done');

      @CacheRepository('users')
      class Repo {
        @CacheEvict({ keys: ['all'] })
        async remove(): Promise<string> {
          return inner();
        }
      }

      const result = await new Repo().remove();

      expect(result).toBe('done');
      expect(inner).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith(`users${CACHE_SEPARATOR}all`);
    });

    it('evicts keys derived from the call arguments and the result', async () => {
      const cache = buildCacheStub();
      registerCache(cache);

      @CacheRepository('users')
      class Repo {
        @CacheEvict({
          keys: [
            (args) => `user${CACHE_SEPARATOR}${args[0]}`,
            (_args, result) => `by-name${CACHE_SEPARATOR}${result}`,
          ],
        })
        async rename(id: string): Promise<string> {
          return `${id}-renamed`;
        }
      }

      await new Repo().rename('42');

      expect(cache.del).toHaveBeenCalledWith(
        `users${CACHE_SEPARATOR}user${CACHE_SEPARATOR}42`,
      );
      expect(cache.del).toHaveBeenCalledWith(
        `users${CACHE_SEPARATOR}by-name${CACHE_SEPARATOR}42-renamed`,
      );
    });

    it('returns the result even when eviction fails', async () => {
      const cache = buildCacheStub();
      registerCache(cache);
      cache.del.mockRejectedValue(new Error('del down'));

      @CacheRepository('users')
      class Repo {
        @CacheEvict({ keys: ['all'] })
        async remove(): Promise<string> {
          return 'done';
        }
      }

      await expect(new Repo().remove()).resolves.toBe('done');
    });

    it('throws when the class is missing @CacheRepository', async () => {
      const cache = buildCacheStub();
      registerCache(cache);

      class Repo {
        @CacheEvict({ keys: ['all'] })
        async remove(): Promise<string> {
          return 'done';
        }
      }

      await expect(new Repo().remove()).rejects.toThrow(
        'is missing @CacheRepository()',
      );
    });
  });

  it('keeps the cache prefix exported by the const module stable', () => {
    expect(CACHE_PREFIX_KEY).toBe('steam-idler');
  });
});
