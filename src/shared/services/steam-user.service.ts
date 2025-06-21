import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas';
import * as SteamUser from 'steam-user';
import { EPersonaState } from 'steam-user';
import { AppLoggerService } from './logger.service';
import { ExpectionService } from './expection.service';
import { AuthExceptionKeys, StatusExceptionKeys } from '../types';

@Injectable()
export class SteamUserService {
  private readonly steamUsers = new Map<string, SteamUser>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly loggerService: AppLoggerService,
    private readonly expectionService: ExpectionService,
  ) {
    this.loggerService.setContext(SteamUserService.name);
    this.init().catch((error) => {
      this.loggerService.error(`Error initializing steam users: ${error}`);
    });
  }

  get users() {
    return Array.from(this.steamUsers.values()).map((user) => ({
      name: user.accountInfo?.name || '',
      steamID: user.steamID?.getSteamID64() || '',
    }));
  }

  async signIn(
    name: string,
    password: string,
    twoFactorCode: string,
    autoRelogin: boolean,
  ): Promise<SteamUser> {
    const userExists = await this.userModel.exists({ name });

    if (userExists) {
      this.expectionService.throwException(
        StatusExceptionKeys.Conflict,
        'User already exists with this name',
        AuthExceptionKeys.UserAlreadyExists,
      );
    }

    const user = await this.userModel.create({ name });

    const steamUser = new SteamUser({
      autoRelogin,
      dataDirectory: null,
      renewRefreshTokens: true,
    });

    steamUser.once('loggedOn', async () => {
      this.steamUsers.set(name, steamUser);
      user.steamID = steamUser.steamID?.getSteamID64() || '';
      await user.save();
    });

    steamUser.once('error', async () => {
      steamUser.removeAllListeners();
      this.steamUsers.delete(name);
      await user.deleteOne().exec();
    });

    steamUser.on('refreshToken', async (refreshToken: string) => {
      user.steamRefreshToken = refreshToken;
      await user.save();
    });

    steamUser.on('webSession', async (_sessionID, cookies) => {
      user.steamCookies = cookies;
      await user.save();
    });

    steamUser.logOn({
      accountName: name,
      password,
      twoFactorCode,
    });

    return new Promise((resolve, reject) => {
      steamUser.once('loggedOn', resolve);
      steamUser.once('error', reject);
    });
  }

  async logOut(user: UserDocument): Promise<void> {
    const userExists = await this.userModel.exists({ name: user.name });
    const steamUser = this.steamUsers.get(user.name);

    if (!userExists) {
      this.expectionService.throwException(
        StatusExceptionKeys.NotFound,
        'User not found',
        AuthExceptionKeys.UserNotFound,
      );
    }

    if (steamUser) {
      steamUser.logOff();
      steamUser.removeAllListeners();
      this.steamUsers.delete(user.name);
    }

    await user.deleteOne().exec();
    this.loggerService.log(`User ${user.name} logged out`);
  }

  idleGames(user: UserDocument): void {
    const steamUser = this.steamUsers.get(user.name);
    if (steamUser && user.idleGames) {
      const playedGames: Array<number | string> = [
        user.customGameExtraInfo,
        ...user.gameIds,
      ];
      if (user.customGameExtraInfo === '') {
        playedGames.shift();
      }
      steamUser.gamesPlayed(playedGames, true);
      this.loggerService.log(
        `User ${user.name} idled following games: ${user.gameIds.join(', ')}`,
      );
    }
  }

  updatePersona(user: UserDocument): void {
    const steamUser = this.steamUsers.get(user.name);
    if (steamUser) {
      steamUser.setPersona(user.personaState as unknown as EPersonaState);
      this.loggerService.log(
        `User ${user.name} updated persona to ${user.personaState} (${EPersonaState[user.personaState]})`,
      );
    }
  }

  stopIdling(user: UserDocument): void {
    const steamUser = this.steamUsers.get(user.name);
    if (steamUser) {
      steamUser.gamesPlayed([]);
      this.loggerService.log(`User ${user.name} stopped idling`);
    }
  }

  private async init(): Promise<void> {
    const users = await this.userModel.find({
      steamID: { $exists: true, $ne: null },
    });

    for (const user of users) {
      this.handleUserInit(user);
    }
  }

  private handleUserInit(user: UserDocument): SteamUser {
    const steamUser = new SteamUser({
      dataDirectory: null,
      autoRelogin: this.isAutoRelogin(user),
      renewRefreshTokens: true,
    });

    steamUser.on('error', (error) => {
      const eCode = error['eresult'];
      if (eCode === SteamUser.EResult.LogonSessionReplaced) {
        this.loggerService.warn(
          `Retry with ${user.name} because of LogonSessionReplaced`,
        );
        return;
      }

      this.loggerService.error(
        `Error initializing steam user ${user.name}: ${error}`,
      );
    });

    steamUser.on('loggedOn', async () => {
      this.loggerService.log(`Steam user ${user.name} logged on`);
      this.steamUsers.set(user.name, steamUser);
      user.steamID = steamUser.steamID?.getSteamID64() || '';
      await user.save();
      this.updatePersona(user);
      this.idleGames(user);
    });

    steamUser.on('refreshToken', async (refreshToken: string) => {
      user.steamRefreshToken = refreshToken;
      await user.save();
    });

    steamUser.on('webSession', async (_sessionID, cookies: string[]) => {
      user.steamCookies = cookies;
      await user.save();
    });

    steamUser.logOn({
      refreshToken: user.steamRefreshToken,
    });

    return steamUser;
  }

  private isAutoRelogin(user: UserDocument): boolean {
    return (
      user.steamCookies.length > 0 &&
      user.steamRefreshToken !== '' &&
      user.steamMachineAuthToken !== ''
    );
  }
}
