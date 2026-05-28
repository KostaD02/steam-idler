import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';

import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { HttpExceptionResponse } from '@steam-idler/server/infra/types';

import { AuthExpectionKeys } from '@steam-idler/server/auth/types';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';

const refresh$: Observable<unknown> | null = null;

const REFRESHABLE_ERROR_KEYS: readonly string[] = [
  AuthExpectionKeys.TokenExpired,
  AuthExpectionKeys.InvalidCredentials,
];

const SKIP_REFRESH_ENDPOINTS = [
  '/auth/refresh',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/sign-out',
];

const shouldSkip = (req: HttpRequest<unknown>): boolean =>
  SKIP_REFRESH_ENDPOINTS.some((endpoint) => req.url.endsWith(endpoint));

const shouldRefresh = (err: HttpErrorResponse): boolean => {
  const body = err.error as HttpExceptionResponse | null;
  return !!body?.errorKeys?.some((key) => REFRESHABLE_ERROR_KEYS.includes(key));
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authApiService = inject(AuthApiService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let refresh$: Observable<unknown> | null = null;

      if (
        shouldSkip(req) ||
        !shouldRefresh(err) ||
        authService.sessionKnownInvalid()
      ) {
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
