import { CACHE_PREFIX_KEY, CACHE_SEPARATOR } from './cache.const';

export function buildPrefixedCacheKey(...key: string[]): string {
  return [CACHE_PREFIX_KEY, ...key].join(CACHE_SEPARATOR);
}

export function buildCacheKey(...key: string[]): string {
  return key.join(CACHE_SEPARATOR);
}
