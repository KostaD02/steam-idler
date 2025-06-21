import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {
  SteamUserService,
  AppLoggerService,
  ExpectionService,
} from 'src/shared/services';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SteamUserService,
    AppLoggerService,
    ExpectionService,
  ],
})
export class AuthModule {}
