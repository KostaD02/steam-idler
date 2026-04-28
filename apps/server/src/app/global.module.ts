import { join } from 'path';

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { EnvironmentService } from '@steam-idler/server/infra/services';

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
    JwtModule.registerAsync({
      useFactory: (env: EnvironmentService) => ({
        secret: env.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${env.get('JWT_EXPIRES_IN')}H`,
        },
      }),
      inject: [EnvironmentService],
    }),
  ],
  providers: [EnvironmentService],
  exports: [EnvironmentService, JwtModule],
})
export class GlobalModule {}
