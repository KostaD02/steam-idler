import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getData() {
    // TODO: Later redirect to directly on FE
    return {
      message: 'Welcome to Steam-Idler Server!',
      timestamp: new Date().toISOString(),
      swagger: '/api/swagger',
    };
  }
}
