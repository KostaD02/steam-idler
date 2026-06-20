import { Injectable } from '@nestjs/common';

import { Response } from 'express';
import { toDataURL } from 'qrcode';

import { getQrRenderOptions } from '@steam-idler/infra';

import {
  EncryptionService,
  ExceptionService,
} from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import {
  compareToHash,
  generateRecoveryCodes,
  generateTotpSecret,
  getTotpAuthUrl,
  hashText,
  normalizeRecoveryCode,
  verifyTotp,
} from '@steam-idler/server/auth/core';
import { AuthRepository } from '@steam-idler/server/auth/domain';
import {
  AuthExpectionKeys,
  MfaEnableResponse,
  MfaGenerateResponse,
  User,
} from '@steam-idler/server/auth/types';

import { AuthTokenService } from './auth-token.service';
import { AuthValidationService } from './auth-validation.service';

@Injectable()
export class AuthMfaService {
  constructor(
    private readonly exceptionService: ExceptionService,
    private readonly encryptionService: EncryptionService,
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async generate(user: User, theme?: string): Promise<MfaGenerateResponse> {
    if (user.mfaEnabled) {
      this.throwAlreadyEnabled();
    }

    const secret = generateTotpSecret();
    const otpauthUrl = getTotpAuthUrl(user.email, secret);
    const qrDataUrl = await toDataURL(otpauthUrl, getQrRenderOptions(theme));

    await this.authRepository.setTotpSecret(
      String(user._id),
      this.encryptionService.encrypt(secret),
    );

    return { qrDataUrl, secret, otpauthUrl };
  }

  async enable(user: User, token: string): Promise<MfaEnableResponse> {
    const account = await this.authRepository.getByIdWithMfa(String(user._id));
    this.authValidationService.checkUserExistence(account);

    if (account.mfaEnabled) {
      this.throwAlreadyEnabled();
    }

    if (!account.totpSecret) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Two-factor authentication has not been initialized',
        [AuthExpectionKeys.MfaNotInitialized],
      );
    }

    const secret = this.encryptionService.decrypt(account.totpSecret);

    if (!verifyTotp(secret, token)) {
      this.throwInvalidCode();
    }

    const recoveryCodes = generateRecoveryCodes();
    const hashedRecoveryCodes = await Promise.all(
      recoveryCodes.map((code) => hashText(normalizeRecoveryCode(code))),
    );

    await this.authRepository.enableMfa(String(user._id), hashedRecoveryCodes);

    return { recoveryCodes };
  }

  async disable(user: User, token: string) {
    const account = await this.loadEnabledMfaAccount(String(user._id));
    const secret = this.encryptionService.decrypt(account.totpSecret as string);

    const isValid =
      verifyTotp(secret, token) ||
      (await this.consumeRecoveryCode(
        String(user._id),
        account.mfaRecoveryCodes,
        token,
      ));

    if (!isValid) {
      this.throwInvalidCode();
    }

    await this.authRepository.disableMfa(String(user._id));

    return { success: true };
  }

  async authenticate(user: User, token: string, response: Response) {
    const account = await this.loadEnabledMfaAccount(String(user._id));
    const secret = this.encryptionService.decrypt(account.totpSecret as string);

    const isValid =
      verifyTotp(secret, token) ||
      (await this.consumeRecoveryCode(
        String(user._id),
        account.mfaRecoveryCodes,
        token,
      ));

    if (!isValid) {
      this.throwInvalidCode();
    }

    const sessionUser = await this.authRepository.getById(String(user._id));
    this.authValidationService.checkUserExistence(sessionUser);

    return this.authTokenService.issueSession(
      sessionUser.toObject<User>(),
      response,
    );
  }

  private async loadEnabledMfaAccount(userId: string) {
    const account = await this.authRepository.getByIdWithMfa(userId);
    this.authValidationService.checkUserExistence(account);

    if (!account.mfaEnabled || !account.totpSecret) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Two-factor authentication is not enabled',
        [AuthExpectionKeys.MfaNotEnabled],
      );
    }

    return account;
  }

  private async consumeRecoveryCode(
    userId: string,
    recoveryCodes: string[] | undefined,
    token: string,
  ): Promise<boolean> {
    if (!recoveryCodes?.length) {
      return false;
    }

    const normalized = normalizeRecoveryCode(token);

    for (const hashed of recoveryCodes) {
      const matches = await compareToHash(normalized, hashed);

      if (matches) {
        await this.authRepository.pullRecoveryCode(userId, hashed);

        return true;
      }
    }

    return false;
  }

  private throwAlreadyEnabled(): never {
    this.exceptionService.throw(
      ExceptionStatusKeys.Conflict,
      'Two-factor authentication is already enabled',
      [AuthExpectionKeys.MfaAlreadyEnabled],
    );
  }

  private throwInvalidCode(): never {
    this.exceptionService.throw(
      ExceptionStatusKeys.Unauthorized,
      'The verification code is invalid',
      [AuthExpectionKeys.MfaInvalidCode],
    );
  }
}
