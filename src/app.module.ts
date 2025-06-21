import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule, IdleModule } from './modules';
import { SharedModule } from './shared/modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/steam-idler',
    ),
    SharedModule,
    AuthModule,
    IdleModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
