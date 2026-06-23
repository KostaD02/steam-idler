import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Response } from 'express';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import {
  AUTH_CONFIG,
  hashText,
  MFA_CONFIG,
} from '@steam-idler/server/auth/core';
import { AuthRepository, UserCreateDto } from '@steam-idler/server/auth/domain';
import {
  AuthenticatedUser,
  AuthExpectionKeys,
  BaseUser,
  MfaChallengeResponse,
  SignUpDto,
  TOKEN_SCOPES,
  Tokens,
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
      settings: {
        showProfileName: true,
        showProfileImage: true,
        maskAccountName: false,
      },
    };

    const user = await this.authRepository.create(payload);
    const { password: _password, ...safeUser } = user.toObject<BaseUser>();
    return this.issueSession(safeUser, response);
  }

  signIn(user: User, response: Response): Tokens | MfaChallengeResponse {
    if (user.mfaEnabled) {
      return this.issueMfaChallenge(user, response);
    }

    return this.issueSession(user, response);
  }

  issueSession(user: User, response: Response): Tokens {
    const tokens = this.getSignInTokens(user);
    this.setSignInTokens(tokens, response);
    response.clearCookie(MFA_CONFIG.PENDING_TOKEN_KEY);
    return tokens;
  }

  issueMfaChallenge(user: User, response: Response): MfaChallengeResponse {
    response.clearCookie(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    response.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_KEY);

    const pendingToken = this.jwtService.sign(
      { _id: String(user._id), scope: TOKEN_SCOPES.MfaPending },
      { expiresIn: MFA_CONFIG.PENDING_TOKEN_EXP },
    );

    response.cookie(MFA_CONFIG.PENDING_TOKEN_KEY, pendingToken, {
      expires: new Date(Date.now() + MFA_CONFIG.PENDING_COOKIE_EXP),
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { mfaRequired: true };
  }

  signOut(response: Response) {
    response.clearCookie(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    response.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    response.clearCookie(MFA_CONFIG.PENDING_TOKEN_KEY);
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

    let decoded: AuthenticatedUser;

    try {
      decoded = this.jwtService.verify<AuthenticatedUser>(refreshToken);
    } catch {
      this.authValidationService.throwInvalidRefreshToken();
    }

    const user = await this.authRepository.getById(String(decoded._id));
    this.authValidationService.checkUserExistence(user);
    this.authValidationService.checkTokenFreshness(
      decoded,
      user.passwordChangedAt,
      response,
    );
    return this.issueSession(user.toObject<User>(), response);
  }

  private getSignInTokens(user: User): Tokens {
    const accessToken = this.jwtService.sign({
      ...user,
      scope: TOKEN_SCOPES.Access,
    });
    const refreshToken = this.jwtService.sign(
      { ...user, scope: TOKEN_SCOPES.Refresh },
      { expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXP },
    );
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private setSignInTokens(tokens: Tokens, response: Response) {
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
