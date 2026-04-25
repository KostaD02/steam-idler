import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvironmentService } from '@steam-idler/server/infra/services';

import { join } from 'path';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '..', '.env'),
        join(__dirname, '..', '..', '.env.development'),
      ],
    }),
  ],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class GlobalModule {}
