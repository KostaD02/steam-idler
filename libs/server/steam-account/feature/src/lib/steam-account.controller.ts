import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Auth, CurrentUser } from '@steam-idler/server/auth/feature';
import { User } from '@steam-idler/server/auth/types';

import { SteamSignInDto } from './dto';
import { SteamAccountService } from './steam-account.service';

// TODO: Create guard to check if user owns the steam account (This will be checked through the steamid)
@Auth()
@Controller('steam-account')
@ApiTags('Steam Account')
export class SteamAccountController {
  constructor(private readonly steamAccountService: SteamAccountService) {}

  @Post()
  addSteamAccount(
    @Body() steamSignInDto: SteamSignInDto,
    @CurrentUser() user: User,
  ) {
    return this.steamAccountService.addSteamAccount(steamSignInDto, user._id);
  }

  @Delete('remove/:name')
  removeSteamAccount(@Param('name') name: string) {
    return this.steamAccountService.removeSteamAccount(name);
  }
}
