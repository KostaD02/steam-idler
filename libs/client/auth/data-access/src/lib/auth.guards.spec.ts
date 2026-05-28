import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

const dummyRoute = {} as ActivatedRouteSnapshot;
const dummyState = {} as RouterStateSnapshot;

const runGuard = (
  guard: typeof authGuard,
  isAuthenticated: boolean,
  authServiceStub: Partial<AuthService> = {},
  routerStub: Partial<Router> = {},
): boolean | UrlTree => {
  const authStub = {
    isAuthenticated: signal(isAuthenticated).asReadonly(),
    ...authServiceStub,
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authStub },
      { provide: Router, useValue: routerStub },
    ],
  });

  return TestBed.runInInjectionContext(
    () => guard(dummyRoute, dummyState) as boolean | UrlTree,
  );
};

describe('authGuard', () => {
  it('allows navigation when authenticated', () => {
    expect(runGuard(authGuard, true)).toBe(true);
  });

  it('redirects to /auth/sign-in when not authenticated', () => {
    const tree = new UrlTree();
    const createUrlTree = jest.fn().mockReturnValue(tree);

    const result = runGuard(authGuard, false, {}, { createUrlTree });

    expect(result).toBe(tree);
    expect(createUrlTree).toHaveBeenCalledWith(['/auth/sign-in']);
  });
});

describe('guestGuard', () => {
  it('allows navigation when not authenticated', () => {
    expect(runGuard(guestGuard, false)).toBe(true);
  });

  it('redirects to /dashboard when authenticated', () => {
    const tree = new UrlTree();
    const createUrlTree = jest.fn().mockReturnValue(tree);

    const result = runGuard(guestGuard, true, {}, { createUrlTree });

    expect(result).toBe(tree);
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
