import { CacheManagerOptions } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';

import { createKeyv } from '@keyv/redis';

import { EnvironmentService } from '@steam-idler/server/infra/services';

import { CACHE_DEFAULT_TTL } from './cache.const';

export function redisFactory(env: EnvironmentService): CacheManagerOptions {
  const logger = new Logger('CacheModule');
  const configuredTtl = Number(env.get('REDIS_TTL'));
  const ttl =
    Number.isFinite(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : CACHE_DEFAULT_TTL;
  const minutes = Math.floor(ttl / 60000);

  logger.log(`Cache TTL set to ${minutes} minute(s)`);

  if (env.get('REDIS_ENABLED') !== 'true') {
    logger.warn('Redis is disabled, using in-memory cache');

    return { ttl };
  }

  const host = env.get('REDIS_HOST') ?? 'localhost';
  const port = Number(env.get('REDIS_PORT') ?? 6379);
  const password = env.get('REDIS_PASSWORD') ?? '';

  logger.log(`Connecting to Redis at ${host}:${port}`);

  return {
    ttl,
    stores: [
      createKeyv({
        socket: { host, port, connectTimeout: 3000 },
        password: password || undefined,
        disableOfflineQueue: true,
      }),
    ],
  };
}
