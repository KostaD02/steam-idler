import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { User } from '@steam-idler/server/auth/types';
import { SteamAccountRepository } from '@steam-idler/server/steam-account/domain';
import { SteamAccountExceptionKeys } from '@steam-idler/server/steam-account/types';

@Injectable()
export class SteamAccountOwnershipGuard implements CanActivate {
  constructor(
    private readonly steamAccountRepository: SteamAccountRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user as User | undefined;
    const accountName = request?.params?.name as string | undefined;

    if (!user || !accountName) {
      this.notFound();
    }

    const steamAccount =
      await this.steamAccountRepository.getByName(accountName);

    if (!steamAccount || String(steamAccount.userId) !== String(user._id)) {
      this.notFound();
    }

    return true;
  }

  private notFound(): never {
    this.exceptionService.throw(
      ExceptionStatusKeys.NotFound,
      'Steam account not found',
      [SteamAccountExceptionKeys.NotFound],
    );
  }
}
