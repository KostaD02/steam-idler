import { inject, Injectable } from '@angular/core';

import { map, Observable, switchMap } from 'rxjs';

import { AuthService } from '@steam-idler/client/auth/data-access';
import {
  SteamAccount,
  SteamSignInDto,
} from '@steam-idler/server/steam-account/types';

import { AccountsApiService } from './accounts-api.service';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly accountsApiService = inject(AccountsApiService);
  private readonly authService = inject(AuthService);

  getSteamAccounts(): Observable<SteamAccount[]> {
    return this.accountsApiService.getSteamAccounts();
  }

  addSteamAccount(dto: SteamSignInDto): Observable<SteamAccount> {
    return this.accountsApiService.addSteamAccount(dto).pipe(
      // Refresh the authenticated user so `user.steamAccounts` reflects the
      // newly linked account across the app (e.g. the dashboard).
      switchMap((account) =>
        this.authService.loadCurrentUser().pipe(map(() => account)),
      ),
    );
  }
}
