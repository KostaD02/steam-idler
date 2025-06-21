import { Controller, Get, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppLoggerService, SteamUserService } from './shared/services';
import {
  StatusExceptionKeys,
  AuthExceptionKeys,
  IdleExceptionKeys,
} from './shared/types';
import { join } from 'path';
import { Response } from 'express';

@ApiTags('root')
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
    description: 'Get base page html',
  })
  root(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
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
