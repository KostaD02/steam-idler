import { EnvironmentService } from '@steam-idler/server/infra/services';

import { CacheRegistry } from './cache.registry';
import { CacheService } from './cache.service';

const resetRegistry = () => {
  (
    CacheRegistry as unknown as {
      service: CacheService | null;
      environment: EnvironmentService | null;
    }
  ).service = null;
  (
    CacheRegistry as unknown as {
      service: CacheService | null;
      environment: EnvironmentService | null;
    }
  ).environment = null;
};

describe('CacheRegistry', () => {
  beforeEach(() => {
    resetRegistry();
  });

  describe('get', () => {
    it('throws when the cache service is not registered', () => {
      expect(() => CacheRegistry.get()).toThrow(
        'CacheRegistry: CacheService is not registered yet',
      );
    });

    it('returns the registered cache service', () => {
      const service = {} as CacheService;
      const env = {} as EnvironmentService;
      CacheRegistry.register(service, env);

      expect(CacheRegistry.get()).toBe(service);
    });
  });

  describe('env', () => {
    it('throws when the environment service is not registered', () => {
      expect(() => CacheRegistry.env()).toThrow(
        'CacheRegistry: EnvironmentService is not registered yet',
      );
    });

    it('returns the registered environment service', () => {
      const service = {} as CacheService;
      const env = {} as EnvironmentService;
      CacheRegistry.register(service, env);

      expect(CacheRegistry.env()).toBe(env);
    });
  });
});
