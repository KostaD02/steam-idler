import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from '@steam-idler/client/infra/data-access';

import {
  GamesToIdleDto,
  SteamAccount,
  SteamAccountSummary,
  SteamSignInDto,
  UpdateAutoReplyDto,
  UpdateDisplayedGameNameDto,
  UpdatePersonaDto,
} from '@steam-idler/server/steam-account/types';

@Injectable({
  providedIn: 'root',
})
export class AccountsApiService {
  private readonly apiService = inject(ApiService);

  private readonly apiUrl = '/steam-account';

  getSteamAccounts(): Observable<SteamAccountSummary[]> {
    return this.apiService.get<SteamAccountSummary[]>(this.apiUrl);
  }

  addSteamAccount(dto: SteamSignInDto): Observable<SteamAccount> {
    return this.apiService.post<SteamAccount>(this.apiUrl, dto);
  }

  startIdling(name: string): Observable<SteamAccountSummary> {
    return this.apiService.post<SteamAccountSummary>(
      `${this.apiUrl}/idle/start/${encodeURIComponent(name)}`,
      {},
    );
  }

  stopIdling(name: string): Observable<SteamAccountSummary> {
    return this.apiService.post<SteamAccountSummary>(
      `${this.apiUrl}/idle/stop/${encodeURIComponent(name)}`,
      {},
    );
  }

  updateIdleGames(
    name: string,
    dto: GamesToIdleDto,
  ): Observable<SteamAccountSummary> {
    return this.apiService.patch<SteamAccountSummary>(
      `${this.apiUrl}/idle/games/${encodeURIComponent(name)}`,
      dto,
    );
  }

  removeSteamAccount(name: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(
      `${this.apiUrl}/remove/${encodeURIComponent(name)}`,
    );
  }

  updatePersona(
    name: string,
    dto: UpdatePersonaDto,
  ): Observable<SteamAccountSummary> {
    return this.apiService.patch<SteamAccountSummary>(
      `${this.apiUrl}/persona/${encodeURIComponent(name)}`,
      dto,
    );
  }

  updateDisplayedGameName(
    name: string,
    dto: UpdateDisplayedGameNameDto,
  ): Observable<SteamAccountSummary> {
    return this.apiService.patch<SteamAccountSummary>(
      `${this.apiUrl}/displayed-game/${encodeURIComponent(name)}`,
      dto,
    );
  }

  startAutoReply(name: string): Observable<SteamAccountSummary> {
    return this.apiService.post<SteamAccountSummary>(
      `${this.apiUrl}/auto-reply/start/${encodeURIComponent(name)}`,
      {},
    );
  }

  stopAutoReply(name: string): Observable<SteamAccountSummary> {
    return this.apiService.post<SteamAccountSummary>(
      `${this.apiUrl}/auto-reply/stop/${encodeURIComponent(name)}`,
      {},
    );
  }

  updateAutoReply(
    name: string,
    dto: UpdateAutoReplyDto,
  ): Observable<SteamAccountSummary> {
    return this.apiService.patch<SteamAccountSummary>(
      `${this.apiUrl}/auto-reply/${encodeURIComponent(name)}`,
      dto,
    );
  }
}
