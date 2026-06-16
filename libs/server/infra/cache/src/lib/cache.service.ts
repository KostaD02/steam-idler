import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import { Cache } from 'cache-manager';

import { buildPrefixedCacheKey } from './cache-key';
import { CACHE_PREFIX_KEY, CACHE_SEPARATOR } from './cache.const';

@Injectable()
export class CacheService {
  readonly keyPrefix = CACHE_PREFIX_KEY;
  readonly keySeparator = CACHE_SEPARATOR;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(this.buildKey(key));
  }

  set<T>(key: string, value: T, ttl?: number): Promise<T> {
    return this.cache.set<T>(this.buildKey(key), value, ttl);
  }

  del(key: string): Promise<boolean> {
    return this.cache.del(this.buildKey(key));
  }

  clear(): Promise<boolean> {
    return this.cache.clear();
  }

  buildKey(...key: string[]): string {
    return buildPrefixedCacheKey(...key);
  }
}
