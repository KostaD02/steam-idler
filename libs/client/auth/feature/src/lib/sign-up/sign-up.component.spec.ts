import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';

import { SignUpComponent } from './sign-up.component';

const buildAuthStub = () => ({
  signUp: jest.fn().mockReturnValue(of({})),
});

type AuthStub = ReturnType<typeof buildAuthStub>;

const buildI18nStub = () => ({
  locale: signal('en'),
  t: jest.fn((key: string) => key),
});

const setup = async () => {
  const auth = buildAuthStub();
  const navigateByUrl = jest.fn();

  await TestBed.configureTestingModule({
    imports: [SignUpComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: I18nService, useValue: buildI18nStub() },
    ],
  }).compileComponents();

  TestBed.inject(Router).navigateByUrl = navigateByUrl;

  const fixture = TestBed.createComponent(SignUpComponent);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    auth: auth as AuthStub,
    navigateByUrl,
  };
};

const fillValidForm = (component: SignUpComponent): void => {
  component.form.setValue({
    displayName: 'Ada',
    email: 'a@b.com',
    password: 'password1',
  });
};

describe('SignUpComponent', () => {
  describe('isInvalid', () => {
    it('returns false for an untouched, pristine control', async () => {
      const { component } = await setup();

      expect(component.isInvalid('displayName')).toBe(false);
    });

    it('returns true once an invalid control is touched', async () => {
      const { component } = await setup();
      component.form.controls.displayName.markAsTouched();

      expect(component.isInvalid('displayName')).toBe(true);
    });

    it('returns false when a touched control holds a valid value', async () => {
      const { component } = await setup();
      component.form.controls.displayName.setValue('Ada');
      component.form.controls.displayName.markAsTouched();

      expect(component.isInvalid('displayName')).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('marks the form touched and does not call the service when invalid', async () => {
      const { component, auth } = await setup();

      component.onSubmit();

      expect(component.form.controls.displayName.touched).toBe(true);
      expect(auth.signUp).not.toHaveBeenCalled();
    });

    it('signs up with the raw form value and navigates to the dashboard', async () => {
      const { component, auth, navigateByUrl } = await setup();
      fillValidForm(component);

      component.onSubmit();

      expect(auth.signUp).toHaveBeenCalledWith({
        displayName: 'Ada',
        email: 'a@b.com',
        password: 'password1',
      });
      expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
      expect(component.submitting()).toBe(false);
      expect(component.errorKey()).toBeNull();
    });

    it('does nothing when a submission is already in flight', async () => {
      const { component, auth } = await setup();
      fillValidForm(component);
      component.submitting.set(true);

      component.onSubmit();

      expect(auth.signUp).not.toHaveBeenCalled();
    });

    it('sets the error key and clears submitting on failure', async () => {
      const { component, auth } = await setup();
      fillValidForm(component);
      const error = new HttpErrorResponse({
        error: { errorKeys: ['errors.auth.email_taken'] },
        status: 409,
      });
      auth.signUp.mockReturnValueOnce(throwError(() => error));

      component.onSubmit();

      expect(component.errorKey()).toBe('errors.auth.email_taken');
      expect(component.submitting()).toBe(false);
    });
  });

  describe('template', () => {
    it('renders the sign-up title and the sign-in switch link', async () => {
      const { fixture } = await setup();

      expect(fixture.nativeElement.textContent).toContain(
        'ui.auth.sign_up.title',
      );
      expect(
        fixture.nativeElement.querySelector('a[href="/auth/sign-in"]'),
      ).not.toBeNull();
    });

    it('shows the error alert once an error key is set', async () => {
      const { fixture, component } = await setup();
      component.errorKey.set('errors.common.app_error');
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert.textContent).toContain('errors.common.app_error');
    });

    it('disables the submit button while submitting', async () => {
      const { fixture, component } = await setup();
      component.submitting.set(true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector<HTMLButtonElement>(
        'button[type="submit"]',
      );
      expect(button.disabled).toBe(true);
    });
  });
});
