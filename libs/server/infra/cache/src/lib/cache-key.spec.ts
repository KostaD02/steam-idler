import { buildCacheKey, buildPrefixedCacheKey } from './cache-key';
import { CACHE_PREFIX_KEY, CACHE_SEPARATOR } from './cache.const';

describe('cache-key', () => {
  describe('buildCacheKey', () => {
    it('joins the parts with the cache separator', () => {
      expect(buildCacheKey('users', 'user-id')).toBe(
        `users${CACHE_SEPARATOR}user-id`,
      );
    });

    it('returns a single part unchanged', () => {
      expect(buildCacheKey('users')).toBe('users');
    });

    it('returns an empty string when no parts are given', () => {
      expect(buildCacheKey()).toBe('');
    });
  });

  describe('buildPrefixedCacheKey', () => {
    it('prepends the cache prefix before joining', () => {
      expect(buildPrefixedCacheKey('users', 'user-id')).toBe(
        `${CACHE_PREFIX_KEY}${CACHE_SEPARATOR}users${CACHE_SEPARATOR}user-id`,
      );
    });

    it('returns just the prefix when no parts are given', () => {
      expect(buildPrefixedCacheKey()).toBe(CACHE_PREFIX_KEY);
    });
  });
});
