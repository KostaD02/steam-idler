import { Injectable } from '@nestjs/common';
import { NameDto } from 'src/shared/dtos';
import {
  SteamUserService,
  ExpectionService,
  UserService,
} from 'src/shared/services';
import { IdleExceptionKeys, StatusExceptionKeys } from 'src/shared/types';
import { GameExtraInfoDto, GameIdsDto } from './dtos';

@Injectable()
export class IdleService {
  constructor(
    private readonly userService: UserService,
    private readonly steamUserService: SteamUserService,
    private readonly expectionService: ExpectionService,
  ) {}

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
    await user.save();

    return {
      success: true,
    };
  }

  async clearGames(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    user.gameIds = [];
    user.idleGames = false;
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
    await user.save();
    this.steamUserService.idleGames(user);

    return {
      success: true,
    };
  }
}
