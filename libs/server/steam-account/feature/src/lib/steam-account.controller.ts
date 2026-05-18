import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Auth, CurrentUser } from '@steam-idler/server/auth/feature';
import { User } from '@steam-idler/server/auth/types';

import { GamesToIdleDto, SteamSignInDto } from './dto';
import { SteamAccountOwnershipGuard } from './guards';
import { SteamAccountService } from './steam-account.service';

@Auth()
@Controller('steam-account')
@ApiTags('Steam Account')
export class SteamAccountController {
  constructor(private readonly steamAccountService: SteamAccountService) {}

  @Get()
  getSteamAccounts(@CurrentUser() user: User) {
    return this.steamAccountService.getSteamAccounts(user._id);
  }

  @Post()
  addSteamAccount(
    @Body() steamSignInDto: SteamSignInDto,
    @CurrentUser() user: User,
  ) {
    return this.steamAccountService.addSteamAccount(steamSignInDto, user._id);
  }

  @Delete('remove/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  removeSteamAccount(@Param('name') name: string) {
    return this.steamAccountService.removeSteamAccount(name);
  }

  @Post('idle/start/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  startIdling(@Param('name') name: string) {
    return this.steamAccountService.idleGames(name);
  }

  @Post('idle/stop/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  stopIdling(@Param('name') name: string) {
    return this.steamAccountService.stopIdling(name);
  }

  @Patch('idle/games/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  updateIdlingGames(@Param('name') name: string, @Body() dto: GamesToIdleDto) {
    return this.steamAccountService.updateIdlingGames(name, dto);
  }
}
