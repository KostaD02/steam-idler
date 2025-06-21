import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppLoggerService, SteamUserService } from './shared/services';
import {
  StatusExceptionKeys,
  AuthExceptionKeys,
  IdleExceptionKeys,
} from './shared/types';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(
    private readonly steamUserService: SteamUserService,
    private readonly loggerService: AppLoggerService,
  ) {
    this.steamUserService.init().catch((error) => {
      this.loggerService.error(`Error initializing steam users: ${error}`);
    });
  }

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
      ...IdleExceptionKeys,
    });
  }
}
