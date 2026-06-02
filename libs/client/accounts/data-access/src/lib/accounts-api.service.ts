import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from '@steam-idler/client/infra/data-access';

import {
  SteamAccount,
  SteamSignInDto,
} from '@steam-idler/server/steam-account/types';

@Injectable({
  providedIn: 'root',
})
export class AccountsApiService {
  private readonly apiService = inject(ApiService);

  private readonly apiUrl = '/steam-account';

  getSteamAccounts(): Observable<SteamAccount[]> {
    return this.apiService.get<SteamAccount[]>(this.apiUrl);
  }

  addSteamAccount(dto: SteamSignInDto): Observable<SteamAccount> {
    return this.apiService.post<SteamAccount>(this.apiUrl, dto);
  }
}
