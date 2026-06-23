import { computed, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';

import {
  LocalStorageService,
  ThemeService,
} from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';
import { LoggerService } from '@steam-idler/client/infra/util';

import {
  ChangePasswordDto,
  MfaChallengeResponse,
  MfaEnableResponse,
  MfaGenerateResponse,
  SignInDto,
  SignUpDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
  User,
} from '@steam-idler/server/auth/types';

import { AuthApiService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly loggerService = inject(LoggerService);
  private readonly authApiService = inject(AuthApiService);
  private readonly localStorageService = inject(LocalStorageService);

  private readonly _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    this.document.defaultView?.addEventListener('storage', (event) => {
      if (event.key === StorageKeysEnum.HasSession && event.newValue === null) {
        this._user.set(null);
      }
      if (event.key === StorageKeysEnum.HasSession && event.newValue !== null) {
        this.loadCurrentUser().subscribe();
      }
    });
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.localStorageService.getItem(StorageKeysEnum.HasSession)) {
      return of(null);
    }
    return this.authApiService.getCurrentUser().pipe(
      tap((user) => {
        this.setUser(user);
        this.loggerService.log(AuthService.name, 'Loaded current user', user);
      }),
      catchError(() => {
        this._user.set(null);
        return of(null);
      }),
    );
  }

  signUp(signUpDto: SignUpDto): Observable<User> {
    return this.authApiService
      .signUp(signUpDto)
      .pipe(switchMap(() => this.fetchAndStoreUser()));
  }

  signIn(signInDto: SignInDto): Observable<User | MfaChallengeResponse> {
    return this.authApiService
      .signIn(signInDto)
      .pipe(
        switchMap((result) =>
          'mfaRequired' in result ? of(result) : this.fetchAndStoreUser(),
        ),
      );
  }

  mfaAuthenticate(token: string): Observable<User> {
    return this.authApiService
      .mfaAuthenticate(token)
      .pipe(switchMap(() => this.fetchAndStoreUser()));
  }

  generateMfa(): Observable<MfaGenerateResponse> {
    return this.authApiService.mfaGenerate(this.themeService.selectedTheme());
  }

  enableMfa(token: string): Observable<MfaEnableResponse> {
    return this.authApiService
      .mfaEnable(token)
      .pipe(
        switchMap((result) => this.fetchAndStoreUser().pipe(map(() => result))),
      );
  }

  disableMfa(token: string): Observable<User> {
    return this.authApiService
      .mfaDisable(token)
      .pipe(switchMap(() => this.fetchAndStoreUser()));
  }

  signOut(): Observable<{ success: true }> {
    return this.authApiService.signOut().pipe(finalize(() => this.clearUser()));
  }

  clearUser(): void {
    this._user.set(null);
    this.localStorageService.removeItem(StorageKeysEnum.HasSession);
  }

  updateUser(dto: UpdateUserDto): Observable<User> {
    return this.authApiService
      .updateUser(dto)
      .pipe(tap((user) => this.setUser(user)));
  }

  updateSettings(dto: UpdateUserSettingsDto): Observable<User> {
    return this.authApiService
      .updateSettings(dto)
      .pipe(tap((user) => this.setUser(user)));
  }

  deleteUser(): Observable<{ success: true }> {
    return this.authApiService.deleteUser().pipe(tap(() => this.clearUser()));
  }

  changePassword(dto: ChangePasswordDto): Observable<User> {
    return this.authApiService
      .changePassword(dto)
      .pipe(switchMap(() => this.fetchAndStoreUser()));
  }

  private setUser(user: User): void {
    this._user.set(user);
    this.localStorageService.setItem(StorageKeysEnum.HasSession, true);
  }

  private fetchAndStoreUser(): Observable<User> {
    return this.authApiService
      .getCurrentUser()
      .pipe(tap((user) => this.setUser(user)));
  }
}
