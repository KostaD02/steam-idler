import { inject, Injectable } from '@angular/core';

import { map, Observable, switchMap } from 'rxjs';

import { AuthService } from '@steam-idler/client/auth/data-access';
import {
  GamesToIdleDto,
  GameWithCards,
  SteamAccountSummary,
  SteamSignInDto,
  UpdateAutoReplyDto,
  UpdateDisplayedGameNameDto,
  UpdatePersonaDto,
} from '@steam-idler/server/steam-account/types';

import { AccountsApiService } from './accounts-api.service';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly accountsApiService = inject(AccountsApiService);
  private readonly authService = inject(AuthService);

  getSteamAccounts(): Observable<SteamAccountSummary[]> {
    return this.accountsApiService.getSteamAccounts();
  }

  getCards(name: string): Observable<GameWithCards[]> {
    return this.accountsApiService.getCards(name);
  }

  addSteamAccount(dto: SteamSignInDto): Observable<SteamAccountSummary> {
    return this.accountsApiService
      .addSteamAccount(dto)
      .pipe(
        switchMap((account) =>
          this.authService.loadCurrentUser().pipe(map(() => account)),
        ),
      );
  }

  startIdling(name: string): Observable<SteamAccountSummary> {
    return this.accountsApiService.startIdling(name);
  }

  stopIdling(name: string): Observable<SteamAccountSummary> {
    return this.accountsApiService.stopIdling(name);
  }

  updateIdleGames(
    name: string,
    dto: GamesToIdleDto,
  ): Observable<SteamAccountSummary> {
    return this.accountsApiService.updateIdleGames(name, dto);
  }

  removeSteamAccount(name: string): Observable<{ success: boolean }> {
    return this.accountsApiService
      .removeSteamAccount(name)
      .pipe(
        switchMap((result) =>
          this.authService.loadCurrentUser().pipe(map(() => result)),
        ),
      );
  }

  updatePersona(
    name: string,
    dto: UpdatePersonaDto,
  ): Observable<SteamAccountSummary> {
    return this.accountsApiService.updatePersona(name, dto);
  }

  updateDisplayedGameName(
    name: string,
    dto: UpdateDisplayedGameNameDto,
  ): Observable<SteamAccountSummary> {
    return this.accountsApiService.updateDisplayedGameName(name, dto);
  }

  startAutoReply(name: string): Observable<SteamAccountSummary> {
    return this.accountsApiService.startAutoReply(name);
  }

  stopAutoReply(name: string): Observable<SteamAccountSummary> {
    return this.accountsApiService.stopAutoReply(name);
  }

  updateAutoReply(
    name: string,
    dto: UpdateAutoReplyDto,
  ): Observable<SteamAccountSummary> {
    return this.accountsApiService.updateAutoReply(name, dto);
  }
}
