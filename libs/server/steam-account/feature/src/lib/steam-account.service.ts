import { Injectable } from '@nestjs/common';

import { ExceptionService } from '@steam-idler/server/infra/services';
import {
  ExceptionStatusKey,
  ExceptionStatusKeys,
  MongoId,
} from '@steam-idler/server/infra/types';

import {
  GamesToIdleDto,
  SteamSignInDto,
  UpdateAutoReplyDto,
  UpdateDisplayedGameNameDto,
  UpdatePersonaDto,
} from './dto';
import { SteamCardsService } from './services/steam-cards.service';
import { SteamUserService } from './services/steam-user.service';

@Injectable()
export class SteamAccountService {
  constructor(
    private readonly steamUserService: SteamUserService,
    private readonly steamCardsService: SteamCardsService,
    private readonly exceptionService: ExceptionService,
  ) {}

  async getSteamAccounts(userId: MongoId) {
    return this.steamUserService.getByUserId(userId);
  }

  async addSteamAccount(steamSignInDto: SteamSignInDto, userId: MongoId) {
    try {
      return await this.steamUserService.addSteamAccount(
        steamSignInDto,
        userId,
      );
    } catch (err) {
      let status: ExceptionStatusKey = ExceptionStatusKeys.EnhanceYourCalm;
      let message = '';
      let errorKeys: string[] = [];

      if (err instanceof Error) {
        this.exceptionService.throw(
          ExceptionStatusKeys.BadRequest,
          'CHECK ME ON WHAT IT HAPPENED',
          ['CHECK ME ON WHAT IT HAPPENED'],
        );
      } else {
        const error = err as {
          status: ExceptionStatusKey;
          message: string;
          errorKeys: string[];
        };
        status = error.status;
        message = error.message;
        errorKeys = error.errorKeys;
      }

      this.exceptionService.throw(status, message, errorKeys);
    }
  }

  removeSteamAccount(name: string) {
    return this.steamUserService.removeSteamAccount(name);
  }

  idleGames(accountName: string) {
    return this.steamUserService.idleGames(accountName, true);
  }

  stopIdling(accountName: string) {
    return this.steamUserService.stopIdling(accountName);
  }

  updateIdlingGames(name: string, dto: GamesToIdleDto) {
    return this.steamUserService.updateIdlingGames(name, dto);
  }

  updatePersona(name: string, dto: UpdatePersonaDto) {
    return this.steamUserService.updatePersona(name, dto.personaStatus);
  }

  updateDisplayedGameName(name: string, dto: UpdateDisplayedGameNameDto) {
    return this.steamUserService.updateDisplayedGameName(
      name,
      dto.displayedGameName,
    );
  }

  startAutoReply(name: string) {
    return this.steamUserService.setAutoReplyEnabled(name, true);
  }

  stopAutoReply(name: string) {
    return this.steamUserService.setAutoReplyEnabled(name, false);
  }

  updateAutoReply(name: string, dto: UpdateAutoReplyDto) {
    return this.steamUserService.updateAutoReply(name, dto);
  }

  getCards(name: string) {
    return this.steamCardsService.getCards(name);
  }
}
