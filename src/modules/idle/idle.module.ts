import { Module } from '@nestjs/common';
import { IdleService } from './idle.service';
import { IdleController } from './idle.controller';

@Module({
  controllers: [IdleController],
  providers: [IdleService],
})
export class IdleModule {}
