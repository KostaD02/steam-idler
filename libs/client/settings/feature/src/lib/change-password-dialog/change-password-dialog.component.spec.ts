import { DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { of, Subject, throwError } from 'rxjs';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';

import { ChangePasswordDialogComponent } from './change-password-dialog.component';

const VALID_FORM = {
  oldPassword: 'oldsecret',
  newPassword: 'newsecret',
  confirmPassword: 'newsecret',
};

const buildAuthStub = () => ({
  changePassword: jest.fn().mockReturnValue(of({})),
});

type AuthStub = ReturnType<typeof buildAuthStub>;

const setup = async () => {
  const close = jest.fn();
  const authService = buildAuthStub();

  await TestBed.configureTestingModule({
    imports: [ChangePasswordDialogComponent],
    providers: [
      { provide: DialogRef, useValue: { close } },
      { provide: AuthService, useValue: authService },
      {
        provide: I18nService,
        useValue: { locale: () => 'en', t: (key: string) => key },
      },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<ChangePasswordDialogComponent> =
    TestBed.createComponent(ChangePasswordDialogComponent);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    authService: authService as AuthStub,
    close,
  };
};

describe('ChangePasswordDialogComponent', () => {
  it('starts with an empty form and no error', async () => {
    const { component } = await setup();

    expect(component.form.getRawValue()).toEqual({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    expect(component.submitting()).toBe(false);
    expect(component.errorKey()).toBeNull();
  });

  describe('isInvalid', () => {
    it('returns false while a control is pristine and untouched', async () => {
      const { component } = await setup();

      expect(component.isInvalid('oldPassword')).toBe(false);
    });

    it('returns true once an invalid control is touched', async () => {
      const { component } = await setup();
      component.form.controls.oldPassword.markAsTouched();

      expect(component.isInvalid('oldPassword')).toBe(true);
    });

    it('returns false when a touched control holds a valid value', async () => {
      const { component } = await setup();
      component.form.controls.oldPassword.setValue('oldsecret');
      component.form.controls.oldPassword.markAsTouched();

      expect(component.isInvalid('oldPassword')).toBe(false);
    });
  });

  describe('isMismatch', () => {
    it('returns false while the confirm control is empty', async () => {
      const { component } = await setup();
      component.form.controls.newPassword.setValue('newsecret');

      expect(component.isMismatch()).toBe(false);
    });

    it('returns true when the passwords differ and confirm is touched', async () => {
      const { component } = await setup();
      component.form.controls.newPassword.setValue('newsecret');
      component.form.controls.confirmPassword.setValue('different');
      component.form.controls.confirmPassword.markAsTouched();

      expect(component.isMismatch()).toBe(true);
    });

    it('returns false when the passwords match', async () => {
      const { component } = await setup();
      component.form.controls.newPassword.setValue('newsecret');
      component.form.controls.confirmPassword.setValue('newsecret');
      component.form.controls.confirmPassword.markAsTouched();

      expect(component.isMismatch()).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('marks the form touched and does not call the service when invalid', async () => {
      const { component, authService } = await setup();

      component.onSubmit();

      expect(authService.changePassword).not.toHaveBeenCalled();
      expect(component.form.controls.oldPassword.touched).toBe(true);
    });

    it('does not submit when the new and confirm passwords mismatch', async () => {
      const { component, authService } = await setup();
      component.form.setValue({
        oldPassword: 'oldsecret',
        newPassword: 'newsecret',
        confirmPassword: 'different',
      });

      component.onSubmit();

      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('calls the service and closes with true on success', async () => {
      const { component, authService, close } = await setup();
      component.form.setValue(VALID_FORM);

      component.onSubmit();

      expect(authService.changePassword).toHaveBeenCalledWith({
        oldPassword: 'oldsecret',
        newPassword: 'newsecret',
      });
      expect(close).toHaveBeenCalledWith(true);
      expect(component.submitting()).toBe(false);
    });

    it('does not re-submit while a request is already in flight', async () => {
      const { component, authService, close } = await setup();
      component.form.setValue(VALID_FORM);
      authService.changePassword.mockReturnValueOnce(new Subject());

      component.onSubmit();
      component.onSubmit();

      expect(authService.changePassword).toHaveBeenCalledTimes(1);
      expect(component.submitting()).toBe(true);
      expect(close).not.toHaveBeenCalled();
    });

    it('sets the error key and clears submitting when the request fails', async () => {
      const { component, authService, close } = await setup();
      component.form.setValue(VALID_FORM);
      authService.changePassword.mockReturnValueOnce(
        throwError(() => ({
          error: { errorKeys: ['errors.auth.invalid_password'] },
        })),
      );

      component.onSubmit();

      expect(component.errorKey()).toBe('errors.auth.invalid_password');
      expect(component.submitting()).toBe(false);
      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('closes the dialog with false', async () => {
      const { component, close } = await setup();

      component.close();

      expect(close).toHaveBeenCalledWith(false);
    });
  });
});
