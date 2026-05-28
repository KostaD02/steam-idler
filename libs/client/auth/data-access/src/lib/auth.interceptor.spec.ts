import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';

import { LocalStorageService } from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';

import { AuthExpectionKeys } from '@steam-idler/server/auth/types';

import { AuthApiService } from './auth-api.service';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const TARGET_URL = '/protected';

const errorBodyWith = (errorKey: string) => ({
  status: 401,
  error: 'Unauthorized',
  errorKeys: [errorKey],
});

class StorageStub {
  private store = new Map<string, unknown>();
  getItem = jest.fn((key: string) => this.store.get(key) ?? null);
  setItem = jest.fn((key: string, value: unknown) => {
    this.store.set(key, value);
  });
  removeItem = jest.fn((key: string) => {
    this.store.delete(key);
  });
}

const setup = () => {
  const storage = new StorageStub();
  const authServiceStub = { clearUser: jest.fn() };
  const apiStub = { refresh: jest.fn().mockReturnValue(of({})) };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: LocalStorageService, useValue: storage },
      { provide: AuthService, useValue: authServiceStub },
      { provide: AuthApiService, useValue: apiStub },
    ],
  });

  return {
    storage,
    authServiceStub,
    apiStub,
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
  };
};

describe('authInterceptor', () => {
  it('passes successful responses through unchanged', () => {
    const { http, controller } = setup();
    let body: unknown;
    http.get(TARGET_URL).subscribe((b) => (body = b));
    controller.expectOne(TARGET_URL).flush({ ok: true });
    expect(body).toEqual({ ok: true });
    controller.verify();
  });

  it('propagates the error when no HasSession marker is present', () => {
    const { http, controller, apiStub, authServiceStub } = setup();
    let received: HttpErrorResponse | undefined;

    http.get(TARGET_URL).subscribe({
      error: (err: HttpErrorResponse) => (received = err),
    });

    controller
      .expectOne(TARGET_URL)
      .flush(errorBodyWith(AuthExpectionKeys.TokenExpired), {
        status: 401,
        statusText: 'Unauthorized',
      });

    expect(received).toBeDefined();
    expect(apiStub.refresh).not.toHaveBeenCalled();
    expect(authServiceStub.clearUser).not.toHaveBeenCalled();
    controller.verify();
  });

  it('propagates the error when the errorKey is not refreshable', () => {
    const { http, controller, storage, apiStub } = setup();
    storage.setItem(StorageKeysEnum.HasSession, true);

    let received: HttpErrorResponse | undefined;
    http.get(TARGET_URL).subscribe({
      error: (err: HttpErrorResponse) => (received = err),
    });

    controller
      .expectOne(TARGET_URL)
      .flush(errorBodyWith('errors.auth.password_changed'), {
        status: 401,
        statusText: 'Unauthorized',
      });

    expect(received).toBeDefined();
    expect(apiStub.refresh).not.toHaveBeenCalled();
    controller.verify();
  });

  it('refreshes on TokenExpired and retries the original request', () => {
    const { http, controller, storage, apiStub } = setup();
    storage.setItem(StorageKeysEnum.HasSession, true);

    let body: unknown;
    http.get(TARGET_URL).subscribe((b) => (body = b));

    controller
      .expectOne(TARGET_URL)
      .flush(errorBodyWith(AuthExpectionKeys.TokenExpired), {
        status: 401,
        statusText: 'Unauthorized',
      });

    expect(apiStub.refresh).toHaveBeenCalledTimes(1);

    // retried request after refresh
    controller.expectOne(TARGET_URL).flush({ ok: true });
    expect(body).toEqual({ ok: true });
    controller.verify();
  });

  it('refreshes on InvalidCredentials and retries the original request', () => {
    const { http, controller, storage, apiStub } = setup();
    storage.setItem(StorageKeysEnum.HasSession, true);

    let body: unknown;
    http.get(TARGET_URL).subscribe((b) => (body = b));

    controller
      .expectOne(TARGET_URL)
      .flush(errorBodyWith(AuthExpectionKeys.InvalidCredentials), {
        status: 401,
        statusText: 'Unauthorized',
      });

    expect(apiStub.refresh).toHaveBeenCalledTimes(1);

    controller.expectOne(TARGET_URL).flush({ ok: true });
    expect(body).toEqual({ ok: true });
    controller.verify();
  });

  it('calls clearUser when the refresh itself fails', () => {
    const { http, controller, storage, apiStub, authServiceStub } = setup();
    storage.setItem(StorageKeysEnum.HasSession, true);
    apiStub.refresh.mockReturnValueOnce(
      throwError(() => new Error('refresh failed')),
    );

    let received: unknown;
    http.get(TARGET_URL).subscribe({
      error: (err) => (received = err),
    });

    controller
      .expectOne(TARGET_URL)
      .flush(errorBodyWith(AuthExpectionKeys.TokenExpired), {
        status: 401,
        statusText: 'Unauthorized',
      });

    expect(authServiceStub.clearUser).toHaveBeenCalledTimes(1);
    expect(received).toBeDefined();
    controller.verify();
  });
});
