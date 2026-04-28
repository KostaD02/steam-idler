import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-local';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { AuthExpectionKeys } from '@steam-idler/server/auth/types';

import { AuthAccountService } from '../services/auth-account.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly exceptionService: ExceptionService,
    private readonly authAccountService: AuthAccountService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    const user = await this.authAccountService.validateUser(email, password);

    if (!user) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Invalid credentials',
        [AuthExpectionKeys.InvalidCredentials],
      );
    }

    return user;
  }
}
