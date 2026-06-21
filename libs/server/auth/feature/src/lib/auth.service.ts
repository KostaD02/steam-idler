import { Injectable } from '@nestjs/common';

import { Response } from 'express';

import {
  UpdateUserDto,
  UpdateUserSettingsDto,
  User,
} from '@steam-idler/server/auth/types';

import { ChangePasswordDto, SignUpDto } from './dto';
import {
  AuthAccountService,
  AuthMfaService,
  AuthTokenService,
} from './services';

@Injectable()
export class AuthService {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authAccountService: AuthAccountService,
    private readonly authMfaService: AuthMfaService,
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

  deleteUser(user: User, response: Response) {
    return this.authAccountService.deleteUser(user, response);
  }

  changePassword(user: User, dto: ChangePasswordDto, response: Response) {
    return this.authAccountService.changePassword(user, dto, response);
  }

  updateUser(user: User, dto: UpdateUserDto) {
    return this.authAccountService.updateUser(user, dto);
  }

  updateSettings(user: User, dto: UpdateUserSettingsDto) {
    return this.authAccountService.updateSettings(user, dto);
  }

  generateMfa(user: User, theme?: string) {
    return this.authMfaService.generate(user, theme);
  }

  enableMfa(user: User, token: string) {
    return this.authMfaService.enable(user, token);
  }

  disableMfa(user: User, token: string) {
    return this.authMfaService.disable(user, token);
  }

  authenticateMfa(user: User, token: string, response: Response) {
    return this.authMfaService.authenticate(user, token, response);
  }
}
