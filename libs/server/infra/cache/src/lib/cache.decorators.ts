import 'reflect-metadata';

import { Logger, SetMetadata } from '@nestjs/common';

import { LogLevelEnum, SafeAny } from '@steam-idler/infra';

import { buildCacheKey } from './cache-key';
import {
  CacheableOptions,
  CacheEvictOptions,
  CacheKeyGenerator,
} from './cache.interfaces';
import { CacheRegistry } from './cache.registry';

export const CACHE_PREFIX_METADATA = 'CACHE_PREFIX_METADATA';

const logger = new Logger('Cache');

type CacheLogType = 'log' | 'error';

function cacheLog(
  type: CacheLogType,
  label: string,
  message: string,
  data?: SafeAny,
): void {
  const logType = Number(CacheRegistry.env().get('SERVER_LOG_TYPE'));
  const minLevel = type === 'error' ? LogLevelEnum.ErrorOnly : LogLevelEnum.All;

  if (logType < minLevel) {
    return;
  }

  logger[type](`[${label}] ${message}`, data);
}

function getPrefix(target: object): string {
  const prefix = Reflect.getMetadata(
    CACHE_PREFIX_METADATA,
    target.constructor,
  ) as string | undefined;

  if (!prefix) {
    const className = (target as { constructor: { name: string } }).constructor
      .name;

    throw new Error(
      `Cache: ${className} uses @Cacheable/@CacheEvict but is missing @CacheRepository().`,
    );
  }

  return prefix;
}

function getLabel(target: object, fnName: string): string {
  const className = (target as { constructor: { name: string } }).constructor
    .name;

  return `${className}.${fnName}`;
}

function resolveKeys(
  keyOrGen: string | CacheKeyGenerator,
  args: SafeAny[],
  result?: SafeAny,
): string[] {
  const resolved =
    typeof keyOrGen === 'function' ? keyOrGen(args, result) : keyOrGen;

  return Array.isArray(resolved) ? resolved : [resolved];
}

export function CacheRepository(prefix?: string): ClassDecorator {
  return (target) =>
    SetMetadata(CACHE_PREFIX_METADATA, prefix ?? target.name)(target);
}

export function Cacheable(options: CacheableOptions): MethodDecorator {
  return (
    target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value as (...args: SafeAny[]) => SafeAny;
    const label = getLabel(target, original.name);

    descriptor.value = async function (this: SafeAny, ...args: SafeAny[]) {
      const cacheService = CacheRegistry.get();
      const prefix = getPrefix(target);
      const suffixes = resolveKeys(options.key, args);
      const key = buildCacheKey(prefix, ...suffixes);

      try {
        const cached = await cacheService.get(key);

        if (cached !== undefined && cached !== null) {
          cacheLog('log', label, 'returned cache', key);

          return cached;
        }
      } catch (err) {
        cacheLog('error', label, `cache read error ${key}`, err);
      }

      const result = await original.apply(this, args);

      if (result !== undefined && result !== null) {
        try {
          await cacheService.set(key, result, options.ttl);
          cacheLog('log', label, 'cache set', key);
        } catch (err) {
          cacheLog('error', label, `cache write error ${key}`, err);
        }
      }

      return result;
    };

    return descriptor;
  };
}

export function CacheEvict(options: CacheEvictOptions): MethodDecorator {
  return (
    target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value as (...args: SafeAny[]) => SafeAny;
    const label = getLabel(target, original.name);

    descriptor.value = async function (this: SafeAny, ...args: SafeAny[]) {
      const result = await original.apply(this, args);
      const cacheService = CacheRegistry.get();
      const prefix = getPrefix(target);

      const keys = options.keys
        .flatMap((k) => resolveKeys(k, args, result))
        .map((suffix) => buildCacheKey(prefix, suffix));

      try {
        await Promise.all(keys.map((k) => cacheService.del(k)));
        keys.forEach((key) => cacheLog('log', label, 'cache evicted', key));
      } catch (err) {
        cacheLog('error', label, 'cache eviction error', err);
      }

      return result;
    };

    return descriptor;
  };
}
