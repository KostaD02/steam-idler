import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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
  exports: [],
})
export class GlobalModule {}
