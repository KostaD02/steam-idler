import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { type HttpExceptionResponse } from '@steam-idler/infra';

import { LocalStorageService } from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';

import { AuthExpectionKeys } from '@steam-idler/server/auth/types';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';

let refresh$: Observable<unknown> | null = null;

const REFRESHABLE_ERROR_KEYS: readonly string[] = [
  AuthExpectionKeys.TokenExpired,
  AuthExpectionKeys.InvalidCredentials,
];

const isRefreshableError = (err: HttpErrorResponse): boolean => {
  const body = err.error as HttpExceptionResponse | null;
  return !!body?.errorKeys?.some((key) => REFRESHABLE_ERROR_KEYS.includes(key));
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authApiService = inject(AuthApiService);
  const authService = inject(AuthService);
  const localStorageService = inject(LocalStorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const hasSession = !!localStorageService.getItem(
        StorageKeysEnum.HasSession,
      );

      if (!hasSession || !isRefreshableError(err)) {
        return throwError(() => err);
      }

      refresh$ ??= authApiService.refresh().pipe(
        finalize(() => (refresh$ = null)),
        shareReplay(1),
      );

      return refresh$.pipe(
        switchMap(() => next(req)),
        catchError((refreshErr) => {
          authService.clearUser();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
