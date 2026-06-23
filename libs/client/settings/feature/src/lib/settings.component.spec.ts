import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { of, Subject, throwError } from 'rxjs';

import { DialogService, LayoutService } from '@steam-idler/client/infra/core';
import { ConfirmDialogService } from '@steam-idler/client/infra/ui/dialog';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import { User, UserSettings } from '@steam-idler/server/auth/types';

import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { SettingsComponent } from './settings.component';

const SETTINGS: UserSettings = {
  showProfileName: false,
  showProfileImage: false,
  maskAccountName: true,
};

const USER = {
  _id: '1',
  email: 'a@b.c',
  displayName: 'Alice',
  settings: SETTINGS,
} as unknown as User;

const sizing = {
  header: 70,
  innerPadding: 32,
  maxContentWidth: 1400,
  innerContentHeight: () => 'calc(100dvh - 134px)',
};

const buildAuthStub = (user: User | null) => ({
  user: signal(user).asReadonly(),
  updateSettings: jest.fn().mockReturnValue(of(USER)),
  deleteUser: jest.fn().mockReturnValue(of({ success: true })),
});

type AuthStub = ReturnType<typeof buildAuthStub>;

const setup = async (user: User | null = USER) => {
  const authService = buildAuthStub(user);
  const open = jest.fn();
  const confirm = jest.fn().mockReturnValue(of(true));
  const navigateByUrl = jest.fn();

  await TestBed.configureTestingModule({
    imports: [SettingsComponent],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: LayoutService, useValue: { sizing } },
      { provide: DialogService, useValue: { open } },
      { provide: ConfirmDialogService, useValue: { confirm } },
      { provide: Router, useValue: { navigateByUrl } },
      {
        provide: I18nService,
        useValue: { locale: () => 'en', t: (key: string) => key },
      },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<SettingsComponent> =
    TestBed.createComponent(SettingsComponent);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    authService: authService as AuthStub,
    open,
    confirm,
    navigateByUrl,
  };
};

describe('SettingsComponent', () => {
  it('starts without an error and not saving', async () => {
    const { component } = await setup();

    expect(component.errorKey()).toBeNull();
    expect(component.saving()).toBe(false);
  });

  it('exposes the user from the auth service', async () => {
    const { component } = await setup();

    expect(component.user()).toBe(USER);
  });

  describe('settings', () => {
    it('returns the settings carried by the current user', async () => {
      const { component } = await setup();

      expect(component.settings()).toEqual(SETTINGS);
    });

    it('falls back to sensible defaults when there is no user', async () => {
      const { component } = await setup(null);

      expect(component.settings()).toEqual({
        showProfileName: true,
        showProfileImage: true,
        maskAccountName: false,
      });
    });
  });

  describe('openChangePassword', () => {
    it('opens the change password dialog', async () => {
      const { component, open } = await setup();

      component.openChangePassword();

      expect(open).toHaveBeenCalledWith(ChangePasswordDialogComponent);
    });
  });

  describe('updateSetting', () => {
    it('calls the service and clears saving on success', async () => {
      const { component, authService } = await setup();

      component.updateSetting({ showProfileName: true });

      expect(authService.updateSettings).toHaveBeenCalledWith({
        showProfileName: true,
      });
      expect(component.saving()).toBe(false);
      expect(component.errorKey()).toBeNull();
    });

    it('keeps saving true while the request is in flight', async () => {
      const { component, authService } = await setup();
      authService.updateSettings.mockReturnValueOnce(new Subject());

      component.updateSetting({ maskAccountName: true });

      expect(component.saving()).toBe(true);
    });

    it('sets the error key and clears saving when the request fails', async () => {
      const { component, authService } = await setup();
      authService.updateSettings.mockReturnValueOnce(
        throwError(() => ({
          error: { errorKeys: ['errors.settings.update_failed'] },
        })),
      );

      component.updateSetting({ showProfileImage: false });

      expect(component.errorKey()).toBe('errors.settings.update_failed');
      expect(component.saving()).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    it('deletes the user and navigates to sign-in when confirmed', async () => {
      const { component, authService, navigateByUrl } = await setup();

      component.deleteAccount();

      expect(authService.deleteUser).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('does nothing when the confirmation is dismissed', async () => {
      const { component, authService, confirm, navigateByUrl } = await setup();
      confirm.mockReturnValueOnce(of(false));

      component.deleteAccount();

      expect(authService.deleteUser).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('sets the error key when deletion fails', async () => {
      const { component, authService, navigateByUrl } = await setup();
      authService.deleteUser.mockReturnValueOnce(
        throwError(() => ({
          error: { errorKeys: ['errors.settings.delete_failed'] },
        })),
      );

      component.deleteAccount();

      expect(component.errorKey()).toBe('errors.settings.delete_failed');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('applies the inner content height to the settings section', async () => {
      const { fixture } = await setup();
      const section =
        fixture.nativeElement.querySelector<HTMLElement>('.settings');

      expect(section.style.height).toBe('calc(100dvh - 134px)');
    });

    it('renders the user email and display name', async () => {
      const { fixture } = await setup();

      expect(fixture.nativeElement.textContent).toContain('a@b.c');
      expect(fixture.nativeElement.textContent).toContain('Alice');
    });
  });
});
