import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  JwtAuthMiddleware,
  JwtAuthModule,
} from '@steam-idler/server/auth/feature';
import {
  SteamAccountRepository,
  SteamAccountEntity,
  SteamAccountSchema,
} from '@steam-idler/server/steam-account/domain';

import { SteamUserService } from './services/steam-user.service';
import { SteamAccountController } from './steam-account.controller';
import { SteamAccountService } from './steam-account.service';

@Module({
  imports: [
    JwtAuthModule,
    MongooseModule.forFeature([
      {
        name: SteamAccountEntity.name,
        schema: SteamAccountSchema,
      },
    ]),
  ],
  controllers: [SteamAccountController],
  providers: [SteamAccountService, SteamAccountRepository, SteamUserService],
})
export class SteamAccountModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(SteamAccountController);
  }
}
