import { Global, Module } from '@nestjs/common';

import { EncryptionService } from './encryption.service';
import { ExceptionService } from './exception.service';

@Global()
@Module({
  providers: [ExceptionService, EncryptionService],
  exports: [ExceptionService, EncryptionService],
})
export class CommonServicesModule {}
