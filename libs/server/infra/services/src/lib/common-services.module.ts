import { Global, Module } from '@nestjs/common';

import { ExceptionService } from './exception.service';

@Global()
@Module({
  providers: [ExceptionService],
  exports: [ExceptionService],
})
export class CommonServicesModule {}
