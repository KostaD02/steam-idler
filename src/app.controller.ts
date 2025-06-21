import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatusExceptionKeys, AuthExceptionKeys } from './shared/types';
import { SteamUserService } from './shared/services';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly steamUserService: SteamUserService) {}

  @Get()
  @ApiOkResponse({
    description: 'Get base page',
  })
  getBasePage() {
    return {
      message: 'TODO: update me',
    };
  }

  @Get('users')
  @ApiOkResponse({
    description: 'Get all users name and steamID',
  })
  getUsers() {
    return this.steamUserService.users;
  }

  @Get('error-keys')
  @ApiOkResponse({
    description: 'Get all error keys',
  })
  getErrorKeys() {
    return Object.values({
      ...StatusExceptionKeys,
      ...AuthExceptionKeys,
    });
  }
}
