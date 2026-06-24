import { HttpException } from '@nestjs/common';

import { Response } from 'express';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,qr')),
}));

jest.mock('@steam-idler/server/auth/core', () => ({
  ...jest.requireActual('@steam-idler/server/auth/core'),
  generateTotpSecret: jest.fn(() => 'SECRET'),
  getTotpAuthUrl: jest.fn(() => 'otpauth://test'),
  verifyTotp: jest.fn(),
  generateRecoveryCodes: jest.fn(() => ['code-1', 'code-2']),
  normalizeRecoveryCode: jest.fn((code: string) => code),
  compareToHash: jest.fn(),
  hashText: jest.fn((value: string) => Promise.resolve(`hash:${value}`)),
}));

import { compareToHash, verifyTotp } from '@steam-idler/server/auth/core';

import { AuthMfaService } from './auth-mfa.service';

const verifyTotpMock = verifyTotp as jest.Mock;
const compareToHashMock = compareToHash as jest.Mock;

const response = {} as Response;
const user = { _id: 'u1', email: 'a@b.com' } as never;

const setup = () => {
  const exceptionService = {
    throw: jest.fn((_status: string, message: string) => {
      throw new HttpException(message, 400);
    }),
  };
  const encryptionService = {
    encrypt: jest.fn((value: string) => `enc:${value}`),
    decrypt: jest.fn((value: string) => `dec:${value}`),
  };
  const authRepository = {
    setTotpSecret: jest.fn().mockResolvedValue(undefined),
    getByIdWithMfa: jest.fn(),
    enableMfa: jest.fn().mockResolvedValue(undefined),
    disableMfa: jest.fn().mockResolvedValue(undefined),
    pullRecoveryCode: jest.fn().mockResolvedValue(undefined),
    getById: jest.fn(),
  };
  const authTokenService = {
    issueSession: jest.fn().mockReturnValue('tokens'),
  };
  const authValidationService = {
    checkUserExistence: jest.fn((account: unknown) => {
      if (!account) {
        throw new HttpException('User not found', 404);
      }
    }),
  };
  const service = new AuthMfaService(
    exceptionService as never,
    encryptionService as never,
    authRepository as never,
    authTokenService as never,
    authValidationService as never,
  );

  return { service, encryptionService, authRepository, authTokenService };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthMfaService', () => {
  describe('generate', () => {
    it('persists the encrypted secret and returns the qr payload', async () => {
      const { service, authRepository } = setup();

      const result = await service.generate(
        { _id: 'u1', email: 'a@b.com', mfaEnabled: false } as never,
        'dark',
      );

      expect(authRepository.setTotpSecret).toHaveBeenCalledWith(
        'u1',
        'enc:SECRET',
      );
      expect(result).toEqual({
        qrDataUrl: 'data:image/png;base64,qr',
        secret: 'SECRET',
        otpauthUrl: 'otpauth://test',
      });
    });

    it('throws when MFA is already enabled', async () => {
      const { service, authRepository } = setup();

      await expect(
        service.generate({
          _id: 'u1',
          email: 'a@b.com',
          mfaEnabled: true,
        } as never),
      ).rejects.toThrow(HttpException);
      expect(authRepository.setTotpSecret).not.toHaveBeenCalled();
    });
  });

  describe('enable', () => {
    it('verifies the token and returns hashed recovery codes', async () => {
      const { service, authRepository } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: false,
        totpSecret: 'enc-secret',
      });
      verifyTotpMock.mockReturnValue(true);

      const result = await service.enable(user, '123456');

      expect(authRepository.enableMfa).toHaveBeenCalledWith('u1', [
        'hash:code-1',
        'hash:code-2',
      ]);
      expect(result).toEqual({ recoveryCodes: ['code-1', 'code-2'] });
    });

    it('throws when the verification code is invalid', async () => {
      const { service, authRepository } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: false,
        totpSecret: 'enc-secret',
      });
      verifyTotpMock.mockReturnValue(false);

      await expect(service.enable(user, '000000')).rejects.toThrow(
        HttpException,
      );
      expect(authRepository.enableMfa).not.toHaveBeenCalled();
    });

    it('throws when MFA was never initialized', async () => {
      const { service, authRepository } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: false,
        totpSecret: '',
      });

      await expect(service.enable(user, '123456')).rejects.toThrow(
        HttpException,
      );
      expect(authRepository.enableMfa).not.toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    it('disables MFA when the token is valid', async () => {
      const { service, authRepository } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: true,
        totpSecret: 'enc-secret',
        mfaRecoveryCodes: [],
      });
      verifyTotpMock.mockReturnValue(true);

      const result = await service.disable(user, '123456');

      expect(authRepository.disableMfa).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ success: true });
    });

    it('consumes a matching recovery code when the token fails', async () => {
      const { service, authRepository } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: true,
        totpSecret: 'enc-secret',
        mfaRecoveryCodes: ['hashed-1'],
      });
      verifyTotpMock.mockReturnValue(false);
      compareToHashMock.mockResolvedValue(true);

      const result = await service.disable(user, 'recovery');

      expect(authRepository.pullRecoveryCode).toHaveBeenCalledWith(
        'u1',
        'hashed-1',
      );
      expect(result).toEqual({ success: true });
    });

    it('throws when neither the token nor a recovery code matches', async () => {
      const { service, authRepository } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: true,
        totpSecret: 'enc-secret',
        mfaRecoveryCodes: [],
      });
      verifyTotpMock.mockReturnValue(false);

      await expect(service.disable(user, 'nope')).rejects.toThrow(
        HttpException,
      );
      expect(authRepository.disableMfa).not.toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('issues a session when the token is valid', async () => {
      const { service, authRepository, authTokenService } = setup();
      const sessionUser = { _id: 'u1', email: 'a@b.com' };
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: true,
        totpSecret: 'enc-secret',
        mfaRecoveryCodes: [],
      });
      authRepository.getById.mockResolvedValue({
        toObject: () => sessionUser,
      });
      verifyTotpMock.mockReturnValue(true);

      const result = await service.authenticate(user, '123456', response);

      expect(authTokenService.issueSession).toHaveBeenCalledWith(
        sessionUser,
        response,
      );
      expect(result).toBe('tokens');
    });

    it('throws when the code is invalid', async () => {
      const { service, authRepository, authTokenService } = setup();
      authRepository.getByIdWithMfa.mockResolvedValue({
        mfaEnabled: true,
        totpSecret: 'enc-secret',
        mfaRecoveryCodes: [],
      });
      verifyTotpMock.mockReturnValue(false);

      await expect(
        service.authenticate(user, 'nope', response),
      ).rejects.toThrow(HttpException);
      expect(authTokenService.issueSession).not.toHaveBeenCalled();
    });
  });
});
