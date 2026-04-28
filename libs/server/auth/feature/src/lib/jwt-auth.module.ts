import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AuthRepository,
  UserEntity,
  UserSchema,
} from '@steam-idler/server/auth/domain';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthMiddleware } from './middleware';
import {
  AuthAccountService,
  AuthHelperService,
  AuthTokenService,
  AuthValidationService,
} from './services';
import { JwtStrategy } from './strategies';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserEntity.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [
    AuthService,
    AuthRepository,
    AuthHelperService,
    AuthTokenService,
    AuthAccountService,
    AuthValidationService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AuthRepository,
    AuthHelperService,
    AuthTokenService,
    AuthAccountService,
    AuthValidationService,
    JwtStrategy,
  ],
})
export class JwtAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(AuthController);
  }
}
