import { Controller, Get } from '@nestjs/common';

import {
  ExceptionStatusKeys,
  CommonExpectionsKeys,
} from '@steam-idler/server/infra/types';

@Controller()
export class AppController {
  @Get()
  base() {
    // TODO: Later redirect to directly on FE
    return {
      message: 'Welcome to Steam-Idler Server!',
      timestamp: new Date().toISOString(),
      swagger: '/api/swagger',
    };
  }

  @Get('error-keys')
  getErrorKeys() {
    return Object.values({ ...ExceptionStatusKeys, ...CommonExpectionsKeys });
  }
}
