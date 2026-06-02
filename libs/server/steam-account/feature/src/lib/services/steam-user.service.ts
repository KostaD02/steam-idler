import { Injectable, Logger } from '@nestjs/common';

import SteamUser from 'steam-user';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys, MongoId } from '@steam-idler/server/infra/types';

import { AuthRepository } from '@steam-idler/server/auth/domain';
import {
  SteamAccountDocument,
  SteamAccountRepository,
} from '@steam-idler/server/steam-account/domain';
import { SteamAccountExceptionKeys } from '@steam-idler/server/steam-account/types';

import { GamesToIdleDto, SteamSignInDto } from '../dto';

@Injectable()
export class SteamUserService {
  private readonly logger = new Logger(SteamUserService.name);
  private readonly usersMap = new Map<string, SteamUser>();

  constructor(
    private readonly steamAccountRepository: SteamAccountRepository,
    private readonly authRepository: AuthRepository,
    private readonly exceptionService: ExceptionService,
  ) {
    this.init();
  }

  getByUserId(userId: MongoId) {
    return this.steamAccountRepository.getByUserId(userId);
  }

  async addSteamAccount(steamSignInDto: SteamSignInDto, userId: MongoId) {
    const userExists = await this.steamAccountRepository.existsByName(
      steamSignInDto.login,
    );

    if (userExists) {
      this.exceptionService.throw(
        ExceptionStatusKeys.Conflict,
        'Steam account is already added to user',
        [SteamAccountExceptionKeys.UserAlreadyHasSteamAccount],
      );
    }

    const { login, password, twoFactorCode } = steamSignInDto;

    const user = await this.steamAccountRepository.create(login, userId);

    const steamUser = new SteamUser({
      autoRelogin: true,
      dataDirectory: null,
      renewRefreshTokens: true,
    });

    this.usersMap.set(steamSignInDto.login, steamUser);

    steamUser.on('refreshToken', async (refreshToken: string) => {
      // ! TODO: THIS PART NEEDS TO BE ENCRYPTED BEFORE GOING LIVE
      user.credentials.refreshToken = refreshToken;
      await user.save();
    });

    steamUser.on('webSession', async (_, cookies: string[]) => {
      // ! TODO: THIS PART NEEDS TO BE ENCRYPTED BEFORE GOING LIVE
      user.credentials.cookies = cookies;
      await user.save();
    });

    // TODO: should I add steamUser.on('error') here?

    steamUser.logOn({
      accountName: login,
      password,
      twoFactorCode,
    });

    return new Promise((resolve, reject) => {
      steamUser.once('loggedOn', async () => {
        try {
          if (!steamUser.steamID) {
            throw new Error('Steam account not logged in');
          }

          user.credentials.id = steamUser.steamID.getSteamID64();
          await user.save();

          // Maintain the reverse link so `user.steamAccounts` stays in sync
          // with the SteamAccount documents that reference this user.
          await this.authRepository.pushSteamAccount(
            userId,
            user._id.toString(),
          );

          //  TODO: update persona
          resolve(user.toObject());
        } catch {
          this.usersMap.delete(login);
          await user.deleteOne().exec();
          reject({
            status: ExceptionStatusKeys.BadRequest,
            message: 'Steam account login error',
            errorKeys: [SteamAccountExceptionKeys.LoginError],
          });
        }
      });

      steamUser.once('error', async (error: Error) => {
        this.usersMap.delete(login);
        await user.deleteOne().exec();
        const isRateLimitExceeded = error?.message === 'RateLimitExceeded';
        reject({
          status: ExceptionStatusKeys.BadRequest,
          message: error?.message || 'Steam account invalid credentials',
          errorKeys: [
            isRateLimitExceeded
              ? SteamAccountExceptionKeys.RateLimitExceeded
              : SteamAccountExceptionKeys.InvalidCredentials,
          ],
        });
      });

      steamUser.once('steamGuard', async (_, cb, lastCodeWrong) => {
        if (lastCodeWrong) {
          this.usersMap.delete(login);
          await user.deleteOne().exec();
          cb('');
          reject({
            status: ExceptionStatusKeys.BadRequest,
            message: 'Steam account guard code is invalid',
            errorKeys: [SteamAccountExceptionKeys.GuardCodeIsInvalid],
          });
        }
      });
    });
  }

  async removeSteamAccount(name: string) {
    const steamUser = this.usersMap.get(name);

    if (!steamUser) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    const steamAccount = await this.steamAccountRepository.getByName(name);

    steamUser.logOff();
    steamUser.removeAllListeners();
    this.usersMap.delete(name);

    if (steamAccount) {
      // Keep `user.steamAccounts` in sync by removing the reverse link.
      await this.authRepository.pullSteamAccount(
        steamAccount.userId,
        steamAccount._id.toString(),
      );
    }

    return this.steamAccountRepository.deleteByAccountName(name);
  }

  async idleGames(accountName: string, forceIdle = false) {
    const steamUser = this.usersMap.get(accountName);

    if (!steamUser) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    const steamUserAccount =
      await this.steamAccountRepository.getByName(accountName);

    if (!steamUserAccount) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    if (forceIdle) {
      steamUserAccount.idleSettings.idleEnabled = true;
      await steamUserAccount.save();
    }

    if (!steamUserAccount.idleSettings.idleEnabled) {
      return;
    }

    if (steamUserAccount.idleSettings.idleGameIds.length === 0) {
      this.logger.warn(
        `No games found to idle for ${steamUserAccount.accountName}, updating idle enabled to false`,
      );
      steamUserAccount.idleSettings.idleEnabled = false;
      await steamUserAccount.save();
      return this.returnSteamAccountObject(steamUserAccount, false);
    }

    const gamesIdsToIdle: Array<number | string> = [
      ...steamUserAccount.idleSettings.idleGameIds,
    ];

    if (steamUserAccount.displayedGameName) {
      gamesIdsToIdle.unshift(steamUserAccount.displayedGameName);
    }

    steamUser.gamesPlayed(gamesIdsToIdle, true);
    this.logger.log(
      `Steam user ${steamUserAccount.accountName} is now idling, following games: ${gamesIdsToIdle.join(', ')}`,
    );
    return this.returnSteamAccountObject(steamUserAccount);
  }

  async stopIdling(accountName: string) {
    const steamUser = this.usersMap.get(accountName);

    if (!steamUser) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    const steamUserAccount =
      await this.steamAccountRepository.getByName(accountName);

    if (!steamUserAccount) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }
    steamUserAccount.idleSettings.idleEnabled = false;
    await steamUserAccount.save();
    steamUser.gamesPlayed([], true);
    this.logger.log(
      `Steam user ${steamUserAccount.accountName} is no longer idling`,
    );
    return this.returnSteamAccountObject(steamUserAccount);
  }

  async updateIdlingGames(accountName: string, dto: GamesToIdleDto) {
    const steamUser = this.usersMap.get(accountName);

    if (!steamUser) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    const steamUserAccount =
      await this.steamAccountRepository.getByName(accountName);

    if (!steamUserAccount) {
      this.exceptionService.throw(
        ExceptionStatusKeys.BadRequest,
        'Steam account not found',
        [SteamAccountExceptionKeys.NotFound],
      );
    }

    steamUserAccount.idleSettings.idleGameIds = dto.gamesIds;
    await steamUserAccount.save();

    this.logger.log(
      `Steam user ${steamUserAccount.accountName} has updated idling games`,
    );

    this.stopIdling(accountName);
    return this.returnSteamAccountObject(steamUserAccount);
  }

  private async init() {
    const users = await this.steamAccountRepository.getAll();

    for (const user of users) {
      this.handleUserInit(user);
    }
  }

  private handleUserInit(user: SteamAccountDocument) {
    const steamUser = new SteamUser({
      autoRelogin: true,
      dataDirectory: null,
      renewRefreshTokens: true,
    });

    steamUser.on('error', (error) => {
      const eCode = error['eresult'];
      if (eCode === SteamUser.EResult.LogonSessionReplaced) {
        this.logger.warn(
          `Steam account ${user.accountName} has been logged out`,
        );
        return;
      }
      this.logger.error(`Steam account ${user.accountName} error`, error);
    });

    steamUser.on('loggedOn', async () => {
      this.logger.log(`Steam user ${user.accountName} logged on`);
      this.usersMap.set(user.accountName, steamUser);
      user.credentials.id = steamUser?.steamID?.getSteamID64() || '';
      await user.save();
      // TODO: update preferred persona status
      // TODO: idle games
    });

    steamUser.on('refreshToken', async (refreshToken) => {
      user.credentials.refreshToken = refreshToken;
      await user.save();
    });

    steamUser.on('webSession', async (_, cookies) => {
      user.credentials.cookies = cookies;
      await user.save();
    });

    // TODO: implement steamUser.chat with friendMessage hook

    steamUser.logOn({
      refreshToken: user.credentials.refreshToken,
    });
  }

  private returnSteamAccountObject(
    steamUserAccount: SteamAccountDocument,
    success = true,
  ) {
    const { credentials, ...rest } = steamUserAccount.toObject();
    return {
      ...rest,
      success,
    };
  }
}
