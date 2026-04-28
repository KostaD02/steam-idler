import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { EnvironmentService } from '@steam-idler/server/infra/services';

import { AUTH_CONFIG } from '@steam-idler/server/auth/core';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly env: EnvironmentService) {
    super({
      ignoreExpiration: false,
      passReqToCallback: false,
      secretOrKey: `${env.get('JWT_SECRET')}`,
      jwtFromRequest: (req: Request) => {
        const refreshToken =
          req.cookies[AUTH_CONFIG.REFRESH_TOKEN_KEY] ||
          req.headers[AUTH_CONFIG.REFRESH_TOKEN_KEY] ||
          req.body[AUTH_CONFIG.REFRESH_TOKEN_KEY];

        if (refreshToken) {
          return refreshToken;
        }

        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
    });
  }

  validate(payload: unknown) {
    return payload;
  }
}
