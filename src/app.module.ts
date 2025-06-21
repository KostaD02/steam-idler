import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { SharedModule } from './shared/modules';
import { AuthModule, IdleModule, PersonaModule } from './modules';

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
    PersonaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
