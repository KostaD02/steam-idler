import { Injectable } from '@nestjs/common';

import { Response } from 'express';

import { User } from '@steam-idler/server/auth/types';

import { SignUpDto } from './dto';
import { AuthAccountService, AuthTokenService } from './services';

@Injectable()
export class AuthService {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authAccountService: AuthAccountService,
  ) {}

  getSerializedUser(payload: User) {
    return this.authAccountService.getSerializedUser(payload);
  }

  signUp(signUpDto: SignUpDto, response: Response) {
    return this.authTokenService.signUp(signUpDto, response);
  }

  signIn(user: User, response: Response) {
    return this.authTokenService.signIn(user, response);
  }

  signOut(response: Response) {
    return this.authTokenService.signOut(response);
  }

  refreshToken(request: Request, response: Response) {
    return this.authTokenService.refreshToken(request, response);
  }
}
