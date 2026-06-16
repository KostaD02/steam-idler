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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Auth, CurrentUser } from '@steam-idler/server/auth/feature';
import { User } from '@steam-idler/server/auth/types';

import {
  GamesToIdleDto,
  SteamSignInDto,
  UpdateAutoReplyDto,
  UpdateDisplayedGameNameDto,
  UpdatePersonaDto,
} from './dto';
import { SteamAccountOwnershipGuard } from './guards';
import { SteamAccountService } from './steam-account.service';

@Auth()
@ApiBearerAuth()
@Controller('steam-account')
@ApiTags('Steam Account')
export class SteamAccountController {
  constructor(private readonly steamAccountService: SteamAccountService) {}

  @Get()
  @ApiOperation({
    summary: "List the current user's Steam accounts",
    description:
      'Returns every Steam account linked to the user resolved from the access token. The `credentials` field is stripped from each account.',
  })
  @ApiOkResponse({ description: "Array of the user's Steam accounts." })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  getSteamAccounts(@CurrentUser() user: User) {
    return this.steamAccountService.getSteamAccounts(user._id);
  }

  @Post()
  @ApiOperation({
    summary: 'Add and log in a Steam account',
    description:
      'Validates the credentials against Steam, persists the account for the authenticated user, links it back onto the user document, and starts the live Steam session. Returns the created account.',
  })
  @ApiCreatedResponse({
    description: 'Steam account added and logged in.',
  })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or the Steam login was rejected. Possible errorKeys: `errors.steam_account.login_should_be_string`, `errors.steam_account.password_should_be_string`, `errors.steam_account.two_factor_code_should_be_string`, `errors.steam_account.two_factor_code_too_short`, `errors.steam_account.two_factor_code_too_long`, `errors.steam_account.login_error`, `errors.steam_account.invalid_credentials`, `errors.steam_account.guard_code_is_invalid`, `errors.steam_account.rate_limit_exceeded`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiConflictResponse({
    description:
      'A Steam account with this login is already added. errorKey: `errors.steam_account.user_already_has_steam_account`.',
  })
  addSteamAccount(
    @Body() steamSignInDto: SteamSignInDto,
    @CurrentUser() user: User,
  ) {
    return this.steamAccountService.addSteamAccount(steamSignInDto, user._id);
  }

  @Delete('remove/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Remove a Steam account',
    description:
      'Logs the Steam session off, unlinks the account from the user document, and deletes it. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Steam account removed. Body: `{ success: boolean }`.',
  })
  @ApiBadRequestResponse({
    description:
      'No active Steam session exists for the given account. errorKey: `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  removeSteamAccount(@Param('name') name: string) {
    return this.steamAccountService.removeSteamAccount(name);
  }

  @Post('idle/start/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Start idling games',
    description:
      "Enables idling and starts playing the account's configured games on Steam. The `:name` path param is the Steam account login and must belong to the authenticated user.",
  })
  @ApiCreatedResponse({ description: 'Idling started for the account.' })
  @ApiBadRequestResponse({
    description:
      'No active Steam session exists for the given account. errorKey: `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  startIdling(@Param('name') name: string) {
    return this.steamAccountService.idleGames(name);
  }

  @Post('idle/stop/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Stop idling games',
    description:
      'Disables idling and clears the games being played on Steam. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiCreatedResponse({ description: 'Idling stopped for the account.' })
  @ApiBadRequestResponse({
    description:
      'No active Steam session exists for the given account. errorKey: `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  stopIdling(@Param('name') name: string) {
    return this.steamAccountService.stopIdling(name);
  }

  @Patch('idle/games/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Update the games to idle',
    description:
      'Replaces the list of Steam app ids the account idles, then restarts idling with the new list. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiOkResponse({ description: 'Idling games updated.' })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or no active Steam session exists. Possible errorKeys: `errors.steam_account.games_ids_should_be_array`, `errors.steam_account.games_ids_must_be_numbers`, `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  updateIdlingGames(@Param('name') name: string, @Body() dto: GamesToIdleDto) {
    return this.steamAccountService.updateIdlingGames(name, dto);
  }

  @Patch('persona/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Update the persona status',
    description:
      'Persists the persona state and applies it to the live Steam session when one exists. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiOkResponse({ description: 'Persona status updated.' })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or no Steam account exists. Possible errorKeys: `errors.steam_account.invalid_persona_status`, `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  updatePersona(@Param('name') name: string, @Body() dto: UpdatePersonaDto) {
    return this.steamAccountService.updatePersona(name, dto);
  }

  @Patch('displayed-game/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Update the displayed game name',
    description:
      'Sets the custom non-Steam game name shown on the profile; if the account is idling, idling is restarted so the name takes effect immediately. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiOkResponse({ description: 'Displayed game name updated.' })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or no Steam account exists. Possible errorKeys: `errors.steam_account.displayed_game_name_should_be_string`, `errors.steam_account.displayed_game_name_too_long`, `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  updateDisplayedGameName(
    @Param('name') name: string,
    @Body() dto: UpdateDisplayedGameNameDto,
  ) {
    return this.steamAccountService.updateDisplayedGameName(name, dto);
  }

  @Post('auto-reply/start/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Enable auto-reply',
    description:
      'Turns on automatic replies to incoming friend messages and resets the per-friend reply tracking. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiCreatedResponse({ description: 'Auto-reply enabled.' })
  @ApiBadRequestResponse({
    description:
      'No Steam account exists for the given name. errorKey: `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  startAutoReply(@Param('name') name: string) {
    return this.steamAccountService.startAutoReply(name);
  }

  @Post('auto-reply/stop/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Disable auto-reply',
    description:
      'Turns off automatic replies to incoming friend messages and resets the per-friend reply tracking. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiCreatedResponse({ description: 'Auto-reply disabled.' })
  @ApiBadRequestResponse({
    description:
      'No Steam account exists for the given name. errorKey: `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  stopAutoReply(@Param('name') name: string) {
    return this.steamAccountService.stopAutoReply(name);
  }

  @Patch('auto-reply/:name')
  @UseGuards(SteamAccountOwnershipGuard)
  @ApiOperation({
    summary: 'Update auto-reply settings',
    description:
      'Updates the auto-reply message template and the while-idling flag, and resets the per-friend reply tracking. The `:name` path param is the Steam account login and must belong to the authenticated user.',
  })
  @ApiOkResponse({ description: 'Auto-reply settings updated.' })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or no Steam account exists. Possible errorKeys: `errors.steam_account.auto_reply_template_should_be_string`, `errors.steam_account.auto_reply_template_too_long`, `errors.steam_account.auto_reply_while_idling_should_be_boolean`, `errors.steam_account.not_found`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'The account does not exist or is not owned by the current user. errorKey: `errors.steam_account.not_found`.',
  })
  updateAutoReply(
    @Param('name') name: string,
    @Body() dto: UpdateAutoReplyDto,
  ) {
    return this.steamAccountService.updateAutoReply(name, dto);
  }
}
