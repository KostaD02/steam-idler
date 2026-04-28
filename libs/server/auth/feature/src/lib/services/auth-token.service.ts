import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Response } from 'express';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { AUTH_CONFIG, hashText } from '@steam-idler/server/auth/core';
import { AuthRepository, UserCreateDto } from '@steam-idler/server/auth/domain';
import {
  AuthenticatedUser,
  AuthExpectionKeys,
  BaseUser,
  SignUpDto,
  User,
  UserRoleEnum,
} from '@steam-idler/server/auth/types';

import { AuthHelperService } from './auth-helper.service';
import { AuthValidationService } from './auth-validation.service';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly exceptionService: ExceptionService,
    private readonly authRepository: AuthRepository,
    private readonly authHelperService: AuthHelperService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async signUp(signUpDto: SignUpDto, response: Response) {
    const emailExists = await this.authRepository.emailExists(signUpDto.email);

    if (emailExists) {
      this.exceptionService.throw(
        ExceptionStatusKeys.Conflict,
        'Email is already taken',
        [AuthExpectionKeys.EmailInUse],
      );
    }

    const userCount = await this.authRepository.userCount();
    const role = userCount === 0 ? UserRoleEnum.Admin : UserRoleEnum.Standard;

    signUpDto.password = await hashText(signUpDto.password);

    const payload: UserCreateDto = {
      role,
      steamAccounts: [],
      email: signUpDto.email,
      password: signUpDto.password,
      displayName: signUpDto.displayName,
    };

    const user = await this.authRepository.create(payload);
    const { password: _, ...safeUser } = user.toObject<BaseUser>();
    return this.signIn(safeUser, response);
  }

  signIn(user: User | AuthenticatedUser, response: Response) {
    return this.setAndGetUserTokens(user, response);
  }

  setAndGetUserTokens(user: User, response: Response) {
    const tokens = this.getSignInToken(user);
    this.setSignInTokens(tokens, response);
    return tokens;
  }

  signOut(response: Response) {
    response.clearCookie(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    response.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    return {
      success: true,
    };
  }

  async refreshToken(request: Request, response: Response) {
    const refreshToken =
      response.req.cookies[AUTH_CONFIG.REFRESH_TOKEN_KEY] ||
      response.getHeader(AUTH_CONFIG.REFRESH_TOKEN_KEY) ||
      response.req.headers[AUTH_CONFIG.REFRESH_TOKEN_KEY] ||
      response.req.body[AUTH_CONFIG.REFRESH_TOKEN_KEY];

    this.authValidationService.checkRefreshToken(refreshToken);

    let decoded: User;

    try {
      decoded = this.jwtService.verify<AuthenticatedUser>(refreshToken);
    } catch {
      this.authValidationService.throwInvalidRefreshToken();
    }

    const user = await this.authRepository.getById(String(decoded._id));
    this.authValidationService.checkUserExistence(user);
    return this.signIn(user.toObject<User>(), response);
  }

  private getSignInToken(user: User) {
    const accessToken = this.jwtService.sign(user);
    const refreshToken = this.jwtService.sign(user, {
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXP,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private setSignInTokens(
    tokens: { access_token: string; refresh_token: string },
    response: Response,
  ) {
    const accessTokenExpiresIn =
      this.authHelperService.calculateJWTExpirationDate(
        AUTH_CONFIG.ACCESS_TOKEN_COOKIE_EXP,
      );
    const refreshTokenExpiresIn =
      this.authHelperService.calculateJWTExpirationDate(
        AUTH_CONFIG.REFRESH_TOKEN_COOKIE_EXP,
      );
    response.cookie(AUTH_CONFIG.ACCESS_TOKEN_KEY, tokens.access_token, {
      expires: new Date(accessTokenExpiresIn),
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    response.cookie(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refresh_token, {
      expires: new Date(refreshTokenExpiresIn),
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }
}
