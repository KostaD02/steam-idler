import { EnvironmentService } from '@steam-idler/server/infra/services';

import { CacheService } from './cache.service';

export class CacheRegistry {
  private static service: CacheService | null = null;
  private static environment: EnvironmentService | null = null;

  static register(service: CacheService, env: EnvironmentService): void {
    CacheRegistry.service = service;
    CacheRegistry.environment = env;
  }

  static env(): EnvironmentService {
    if (!CacheRegistry.environment) {
      throw new Error(
        'CacheRegistry: EnvironmentService is not registered yet. Import CacheModule before any repository that uses @Cacheable/@CacheEvict.',
      );
    }

    return CacheRegistry.environment;
  }

  static get(): CacheService {
    if (!CacheRegistry.service) {
      throw new Error(
        'CacheRegistry: CacheService is not registered yet. Import CacheModule before any repository that uses @Cacheable/@CacheEvict.',
      );
    }

    return CacheRegistry.service;
  }
}
