import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EnvironmentService } from '@steam-idler/server/infra/services';

import { AppController } from './app.controller';
import { GlobalModule } from './global.module';

@Module({
  imports: [
    GlobalModule,
    MongooseModule.forRootAsync({
      useFactory: (env: EnvironmentService) => ({
        uri: env.get('DATABASE_URL', 'mongodb://127.0.0.1:27017/steam-idler'),
        connectionFactory: (connection) => {
          const logger = new Logger('MongooseModule');
          connection.on('error', (err: unknown) => {
            logger.error(`MongoDB connection error: ${err}`);
          });
          logger.log('MongoDB connected');
          return connection;
        },
      }),
      inject: [EnvironmentService],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
