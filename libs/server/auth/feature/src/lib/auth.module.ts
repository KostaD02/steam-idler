import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { RefreshJwtGuard } from './guards';
import { JwtAuthModule } from './jwt-auth.module';
import { LocalStrategy, RefreshJwtStrategy } from './strategies';

@Module({
  imports: [JwtAuthModule],
  controllers: [AuthController],
  providers: [LocalStrategy, RefreshJwtStrategy, RefreshJwtGuard],
})
export class AuthModule {}
