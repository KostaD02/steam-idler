import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules';
import { SteamUserService, AppLoggerService } from './shared/services';
import { User, UserSchema } from './schemas';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/steam-idler',
    ),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [SteamUserService, AppLoggerService],
})
export class AppModule {}
