import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  getBasePage() {
    return {
      message: 'TODO: update me',
    };
  }
}
