import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas';
import {
  SteamUserService,
  AppLoggerService,
  ExpectionService,
  UserService,
} from '../services';

@Global()
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
  providers: [
    SteamUserService,
    AppLoggerService,
    ExpectionService,
    UserService,
  ],
  exports: [SteamUserService, AppLoggerService, ExpectionService, UserService],
})
export class SharedModule {}
