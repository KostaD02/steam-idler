import { CacheModule as NestCacheManagerModule } from '@nestjs/cache-manager';
import { Module, OnModuleInit } from '@nestjs/common';

import { EnvironmentService } from '@steam-idler/server/infra/services';

import { CacheRegistry } from './cache.registry';
import { CacheService } from './cache.service';
import { redisFactory } from './factory';

@Module({
  imports: [
    NestCacheManagerModule.registerAsync({
      isGlobal: true,
      useFactory: redisFactory,
      inject: [EnvironmentService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule implements OnModuleInit {
  constructor(
    private readonly cacheService: CacheService,
    private readonly envService: EnvironmentService,
  ) {}

  onModuleInit(): void {
    CacheRegistry.register(this.cacheService, this.envService);
  }
}
