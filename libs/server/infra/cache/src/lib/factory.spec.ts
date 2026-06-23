jest.mock('@keyv/redis', () => ({
  createKeyv: jest.fn().mockReturnValue({ store: 'keyv-instance' }),
}));

import { createKeyv } from '@keyv/redis';

import { EnvironmentService } from '@steam-idler/server/infra/services';

import { CACHE_DEFAULT_TTL } from './cache.const';
import { redisFactory } from './factory';

const createKeyvMock = createKeyv as jest.Mock;

const buildEnvStub = (values: Record<string, string | undefined>) =>
  ({
    get: jest.fn((key: string) => values[key]),
  }) as unknown as EnvironmentService;

describe('redisFactory', () => {
  beforeEach(() => {
    createKeyvMock.mockClear();
  });

  it('falls back to the in-memory cache when redis is disabled', () => {
    const env = buildEnvStub({ REDIS_ENABLED: 'false' });

    const options = redisFactory(env);

    expect(options).toEqual({ ttl: CACHE_DEFAULT_TTL });
    expect(createKeyvMock).not.toHaveBeenCalled();
  });

  it('uses the default ttl when REDIS_TTL is not a positive number', () => {
    const env = buildEnvStub({ REDIS_ENABLED: 'false', REDIS_TTL: '0' });

    const options = redisFactory(env);

    expect(options.ttl).toBe(CACHE_DEFAULT_TTL);
  });

  it('honours a configured positive REDIS_TTL', () => {
    const env = buildEnvStub({ REDIS_ENABLED: 'false', REDIS_TTL: '60000' });

    const options = redisFactory(env);

    expect(options.ttl).toBe(60000);
  });

  it('builds a keyv redis store when redis is enabled', () => {
    const env = buildEnvStub({
      REDIS_ENABLED: 'true',
      REDIS_HOST: 'redis-host',
      REDIS_PORT: '1234',
      REDIS_PASSWORD: 'secret',
    });

    const options = redisFactory(env);

    expect(createKeyvMock).toHaveBeenCalledWith({
      socket: { host: 'redis-host', port: 1234, connectTimeout: 3000 },
      password: 'secret',
      disableOfflineQueue: true,
    });
    expect(options.stores).toEqual([{ store: 'keyv-instance' }]);
  });

  it('uses default connection details and omits the password when blank', () => {
    const env = buildEnvStub({ REDIS_ENABLED: 'true' });

    redisFactory(env);

    expect(createKeyvMock).toHaveBeenCalledWith({
      socket: { host: 'localhost', port: 6379, connectTimeout: 3000 },
      password: undefined,
      disableOfflineQueue: true,
    });
  });
});
