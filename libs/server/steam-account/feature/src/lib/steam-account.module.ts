import { Module } from '@nestjs/common';

import { SteamAccountController } from './steam-account.controller';
import { SteamAccountService } from './steam-account.service';

@Module({
  imports: [],
  controllers: [SteamAccountController],
  providers: [SteamAccountService],
  exports: [SteamAccountService],
})
export class SteamAccountModule {}
