import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getBasePage() {
    return {
      message: 'TODO: update me',
    };
  }
}
