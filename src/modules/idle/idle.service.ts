import { Injectable } from '@nestjs/common';
import { NameDto } from 'src/shared/dtos';
import {
  SteamUserService,
  ExpectionService,
  UserService,
  AppLoggerService,
} from 'src/shared/services';
import { IdleExceptionKeys, StatusExceptionKeys } from 'src/shared/types';
import { GameExtraInfoDto, GameIdsDto, ReplyMessageDto } from './dtos';

@Injectable()
export class IdleService {
  constructor(
    private readonly userService: UserService,
    private readonly loggerService: AppLoggerService,
    private readonly steamUserService: SteamUserService,
    private readonly expectionService: ExpectionService,
  ) {
    this.loggerService.setContext(IdleService.name);
  }

  async startIdling(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    if (user.gameIds.length === 0) {
      user.idleGames = false;
      await user.save();
      this.expectionService.throwException(
        StatusExceptionKeys.BadRequest,
        'No games to idle',
        IdleExceptionKeys.NoGamesToIdle,
      );
    }

    user.idleGames = true;
    await user.save();

    this.steamUserService.idleGames(user);

    return {
      success: true,
    };
  }

  async stopIdling(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    user.idleGames = false;
    await user.save();

    this.steamUserService.stopIdling(user);

    return {
      success: true,
    };
  }

  async gamesToIdle(gameIdsDto: GameIdsDto): Promise<{ success: boolean }> {
    const { name, gameIds } = gameIdsDto;

    const user = await this.userService.getUserDocument(name);

    const gameIdsToIdle = gameIds.filter((gameId) => Number(gameId));

    if (gameIdsToIdle.length === 0) {
      this.expectionService.throwException(
        StatusExceptionKeys.BadRequest,
        'No valid game IDs provided',
        IdleExceptionKeys.NoValidGameIdsProvided,
      );
    }

    user.gameIds = gameIdsToIdle;
    this.loggerService.log(
      `User ${name} set game IDs to ${gameIdsToIdle.join(', ')}`,
    );
    await user.save();
    this.steamUserService.idleGames(user);

    return {
      success: true,
    };
  }

  async clearGames(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    user.gameIds = [];
    user.idleGames = false;
    this.loggerService.log(`User ${name} cleared game IDs`);
    await user.save();

    return {
      success: true,
    };
  }

  async setGameExtraInfo(
    gameExtraInfoDto: GameExtraInfoDto,
  ): Promise<{ success: boolean }> {
    const { name, gameExtraInfo } = gameExtraInfoDto;

    const user = await this.userService.getUserDocument(name);

    user.customGameExtraInfo = gameExtraInfo;
    this.loggerService.log(
      `User ${name} set custom game extra info to ${gameExtraInfo}`,
    );
    await user.save();
    this.steamUserService.idleGames(user);

    return {
      success: true,
    };
  }

  async removeGameExtraInfo(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    user.customGameExtraInfo = '';
    this.loggerService.log(`User ${name} removed custom game extra info`);
    await user.save();
    this.steamUserService.idleGames(user);

    return {
      success: true,
    };
  }

  async setReplyMessage(
    replyMessageDto: ReplyMessageDto,
  ): Promise<{ success: boolean }> {
    const { name, message } = replyMessageDto;

    const user = await this.userService.getUserDocument(name);

    user.replyMessageTemplate = message;
    this.loggerService.log(`User ${name} set reply message template`);
    await user.save();

    return {
      success: true,
    };
  }

  async clearReplyMessage(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    user.replyMessageTemplate = '';
    user.replyMessageWhileIdle = false;
    this.loggerService.log(`User ${name} stopped replying while idle`);
    await user.save();

    return {
      success: true,
    };
  }

  async setMessageWhileIdle(
    nameDto: NameDto,
    replyMessageWhileIdle: boolean,
  ): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    user.replyMessageWhileIdle = replyMessageWhileIdle;
    this.loggerService.log(
      `User ${name} ${
        replyMessageWhileIdle ? 'started' : 'stopped'
      } replying while idle`,
    );
    await user.save();

    return {
      success: true,
    };
  }
}
