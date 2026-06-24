import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { EMPTY, of, throwError } from 'rxjs';

import { LayoutService, ThemeService } from '@steam-idler/client/infra/core';
import { ThemeEnum } from '@steam-idler/client/infra/types';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';

import { HeaderComponent } from './header.component';

const buildThemeStub = () => {
  const selectedTheme = signal<string>(ThemeEnum.Dark);

  return {
    selectedTheme,
    toggleTheme: jest.fn(),
  };
};

const buildLayoutStub = () => ({
  isMobileView: signal(false),
  sizing: {
    header: 70,
    innerPadding: 32,
    maxContentWidth: 1400,
  },
});

const buildAuthStub = () => ({
  isAuthenticated: signal(false),
  signOut: jest.fn().mockReturnValue(of({ success: true })),
});

const buildI18nStub = () => ({
  locale: signal('en'),
  t: jest.fn((key: string) => key),
  setLocale: jest.fn().mockResolvedValue(true),
});

type ThemeStub = ReturnType<typeof buildThemeStub>;
type LayoutStub = ReturnType<typeof buildLayoutStub>;
type AuthStub = ReturnType<typeof buildAuthStub>;

const setup = async () => {
  const theme = buildThemeStub();
  const layout = buildLayoutStub();
  const auth = buildAuthStub();
  const i18n = buildI18nStub();

  await TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [
      provideRouter([]),
      { provide: ThemeService, useValue: theme },
      { provide: LayoutService, useValue: layout },
      { provide: AuthService, useValue: auth },
      { provide: I18nService, useValue: i18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(HeaderComponent);
  const router = TestBed.inject(Router);
  const navigateByUrl = jest
    .spyOn(router, 'navigateByUrl')
    .mockResolvedValue(true);

  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    theme: theme as ThemeStub,
    layout: layout as LayoutStub,
    auth: auth as AuthStub,
    navigateByUrl,
  };
};

describe('HeaderComponent', () => {
  it('renders the logo link', async () => {
    const { fixture } = await setup();

    expect(fixture.nativeElement.textContent).toContain('Steam Idler');
  });

  describe('isDarkTheme', () => {
    it('is true when the selected theme is dark', async () => {
      const { component } = await setup();

      expect(component.isDarkTheme()).toBe(true);
    });

    it('is false when the selected theme is light', async () => {
      const { component, theme } = await setup();
      theme.selectedTheme.set(ThemeEnum.Light);

      expect(component.isDarkTheme()).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('delegates to the theme service', async () => {
      const { component, theme } = await setup();

      component.toggleTheme();

      expect(theme.toggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigationItems', () => {
    it('excludes items that require login when not authenticated', async () => {
      const { component } = await setup();

      const paths = component.navigationItems().map((item) => item.path);

      expect(paths).toEqual(['/', '/auth', '/api']);
    });

    it('shows the post-login items when authenticated', async () => {
      const { component, auth } = await setup();
      auth.isAuthenticated.set(true);

      const paths = component.navigationItems().map((item) => item.path);

      expect(paths).toEqual(['/', '/accounts', '/settings', '/api']);
    });
  });

  describe('isAuthenticated', () => {
    it('reflects the auth service signal', async () => {
      const { component, auth } = await setup();

      expect(component.isAuthenticated()).toBe(false);

      auth.isAuthenticated.set(true);

      expect(component.isAuthenticated()).toBe(true);
    });
  });

  describe('signOut', () => {
    it('closes the side nav, signs out, and navigates to sign-in', async () => {
      const { component, auth, navigateByUrl } = await setup();
      component.isSideNavOpen.set(true);

      component.signOut();

      expect(component.isSideNavOpen()).toBe(false);
      expect(auth.signOut).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('still navigates to sign-in when sign-out fails', async () => {
      const { component, auth, navigateByUrl } = await setup();
      auth.signOut.mockReturnValueOnce(throwError(() => new Error('server')));

      component.signOut();

      expect(navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('does not error the caller when the stream completes empty', async () => {
      const { component, auth, navigateByUrl } = await setup();
      auth.signOut.mockReturnValueOnce(EMPTY);

      component.signOut();

      expect(navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  describe('sign-out button', () => {
    it('is hidden when the user is not authenticated', async () => {
      const { fixture } = await setup();

      expect(
        fixture.nativeElement.querySelector('.header__sign-out'),
      ).toBeNull();
    });

    it('is rendered and signs out on click when authenticated', async () => {
      const { fixture, component, auth, navigateByUrl } = await setup();
      auth.isAuthenticated.set(true);
      fixture.detectChanges();

      const button =
        fixture.nativeElement.querySelector<HTMLButtonElement>(
          '.header__sign-out',
        );
      expect(button).not.toBeNull();

      jest.spyOn(component, 'signOut');
      button?.click();

      expect(component.signOut).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  describe('theme toggle button', () => {
    it('toggles the theme on click', async () => {
      const { fixture, theme } = await setup();

      const button = fixture.nativeElement.querySelector<HTMLButtonElement>(
        '.header__theme-toggle',
      );
      button?.click();

      expect(theme.toggleTheme).toHaveBeenCalledTimes(1);
    });
  });
});
