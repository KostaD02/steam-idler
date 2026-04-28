import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ExceptionStatusKeys,
  CommonExpectionsKeys,
} from '@steam-idler/server/infra/types';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'Server health/landing payload',
    description:
      'Returns a static welcome message, the current server timestamp, and a path to the Swagger docs. Will eventually redirect to the frontend.',
  })
  @ApiOkResponse({
    description:
      'Welcome payload. Body: `{ message: string, timestamp: string, swagger: string }`.',
  })
  base() {
    // TODO: Later redirect to directly on FE
    return {
      message: 'Welcome to Steam-Idler Server!',
      timestamp: new Date().toISOString(),
      swagger: '/api/swagger',
    };
  }

  @Get('error-keys')
  @ApiOperation({
    summary: 'List all error keys emitted by the API',
    description:
      'Returns the union of `ExceptionStatusKeys` and `CommonExpectionsKeys` as a flat string array. Useful for the frontend to seed translation files for every `errorKeys` value the server can return.',
  })
  @ApiOkResponse({
    description: 'Array of error key strings.',
  })
  getErrorKeys() {
    return Object.values({ ...ExceptionStatusKeys, ...CommonExpectionsKeys });
  }
}
