import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CacheModule } from '@steam-idler/server/infra/cache';

import {
  JwtAuthMiddleware,
  JwtAuthModule,
} from '@steam-idler/server/auth/feature';
import {
  SteamAccountRepository,
  SteamAccountEntity,
  SteamAccountSchema,
} from '@steam-idler/server/steam-account/domain';

import { SteamAccountOwnershipGuard } from './guards';
import { SteamCardsService } from './services/steam-cards.service';
import { SteamUserService } from './services/steam-user.service';
import { SteamAccountController } from './steam-account.controller';
import { SteamAccountService } from './steam-account.service';

@Module({
  imports: [
    JwtAuthModule,
    CacheModule,
    MongooseModule.forFeature([
      {
        name: SteamAccountEntity.name,
        schema: SteamAccountSchema,
      },
    ]),
  ],
  controllers: [SteamAccountController],
  providers: [
    SteamAccountService,
    SteamAccountRepository,
    SteamUserService,
    SteamCardsService,
    SteamAccountOwnershipGuard,
  ],
})
export class SteamAccountModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(SteamAccountController);
  }
}
