import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from '@steam-idler/client/infra/data-access';
import { Theme } from '@steam-idler/client/infra/types';

import {
  ChangePasswordDto,
  MfaChallengeResponse,
  MfaEnableResponse,
  MfaGenerateResponse,
  SignInDto,
  SignUpDto,
  Tokens,
  UpdateUserDto,
  UpdateUserSettingsDto,
  User,
} from '@steam-idler/server/auth/types';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiService = inject(ApiService);

  private readonly apiUrl = '/auth';

  getCurrentUser(): Observable<User> {
    return this.apiService.get<User>(this.apiUrl);
  }

  signUp(signUpDto: SignUpDto): Observable<Tokens> {
    return this.apiService.post<Tokens>(`${this.apiUrl}/sign-up`, signUpDto);
  }

  signIn(signInDto: SignInDto): Observable<Tokens | MfaChallengeResponse> {
    return this.apiService.post<Tokens | MfaChallengeResponse>(
      `${this.apiUrl}/sign-in`,
      signInDto,
    );
  }

  mfaGenerate(theme: Theme): Observable<MfaGenerateResponse> {
    return this.apiService.post<MfaGenerateResponse>(
      `${this.apiUrl}/mfa/generate?theme=${theme}`,
      {},
    );
  }

  mfaEnable(token: string): Observable<MfaEnableResponse> {
    return this.apiService.post<MfaEnableResponse>(
      `${this.apiUrl}/mfa/enable`,
      { token },
    );
  }

  mfaDisable(token: string): Observable<{ success: true }> {
    return this.apiService.post<{ success: true }>(
      `${this.apiUrl}/mfa/disable`,
      { token },
    );
  }

  mfaAuthenticate(token: string): Observable<Tokens> {
    return this.apiService.post<Tokens>(`${this.apiUrl}/mfa/authenticate`, {
      token,
    });
  }

  signOut(): Observable<{ success: true }> {
    return this.apiService.post<{ success: true }>(
      `${this.apiUrl}/sign-out`,
      {},
    );
  }

  refresh(): Observable<Tokens> {
    return this.apiService.post<Tokens>(`${this.apiUrl}/refresh`, {});
  }

  updateUser(dto: UpdateUserDto): Observable<User> {
    return this.apiService.patch<User>(this.apiUrl, dto);
  }

  updateSettings(dto: UpdateUserSettingsDto): Observable<User> {
    return this.apiService.patch<User>(`${this.apiUrl}/settings`, dto);
  }

  deleteUser(): Observable<{ success: true }> {
    return this.apiService.delete<{ success: true }>(this.apiUrl);
  }

  changePassword(dto: ChangePasswordDto): Observable<Tokens> {
    return this.apiService.patch<Tokens>(`${this.apiUrl}/change-password`, dto);
  }
}
