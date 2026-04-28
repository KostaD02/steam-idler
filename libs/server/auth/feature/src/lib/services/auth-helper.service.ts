import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EnvironmentService } from '@steam-idler/server/infra/services';

@Injectable()
export class AuthHelperService {
  constructor(
    private readonly env: EnvironmentService,
    private readonly jwtService: JwtService,
  ) {}

  calculateJWTExpirationDate(expiresIn: number): number {
    return Date.now() + Number(this.env.get('JWT_EXPIRES_IN')) * expiresIn;
  }
}
