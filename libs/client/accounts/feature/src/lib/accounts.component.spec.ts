import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { of, Subject, throwError } from 'rxjs';

import { LayoutService } from '@steam-idler/client/infra/core';

import {
  AccountsService,
  QrLoginStreamEvent,
} from '@steam-idler/client/accounts/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import { QrLoginEventType } from '@steam-idler/server/steam-account/types';

import { AccountsComponent } from './accounts.component';

const VALID_FORM = {
  login: 'user',
  password: 'secret',
  twoFactorCode: 'ABCDE',
};

const sizing = {
  header: 70,
  innerPadding: 32,
  maxContentWidth: 1400,
  innerContentHeight: () => 'calc(100dvh - 134px)',
};

const buildAccountsStub = (qr: Subject<QrLoginStreamEvent>) => ({
  addSteamAccount: jest.fn().mockReturnValue(of({})),
  streamQrLogin: jest.fn().mockReturnValue(qr.asObservable()),
});

type AccountsStub = ReturnType<typeof buildAccountsStub>;

const setup = async () => {
  const qr = new Subject<QrLoginStreamEvent>();
  const accounts = buildAccountsStub(qr);
  const navigateByUrl = jest.fn();

  await TestBed.configureTestingModule({
    imports: [AccountsComponent],
    providers: [
      { provide: AccountsService, useValue: accounts },
      { provide: LayoutService, useValue: { sizing } },
      { provide: Router, useValue: { navigateByUrl } },
      {
        provide: I18nService,
        useValue: { locale: () => 'en', t: (key: string) => key },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AccountsComponent);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    accounts: accounts as AccountsStub,
    qr,
    navigateByUrl,
  };
};

describe('AccountsComponent', () => {
  it('starts in credentials mode with an idle qr status', async () => {
    const { component } = await setup();

    expect(component.mode()).toBe('credentials');
    expect(component.qrStatus()).toBe('idle');
    expect(component.submitting()).toBe(false);
    expect(component.errorKey()).toBeNull();
  });

  it('applies the inner content height to the accounts section', async () => {
    const { fixture } = await setup();
    const section =
      fixture.nativeElement.querySelector<HTMLElement>('.accounts');

    expect(section.style.height).toBe('calc(100dvh - 134px)');
  });

  describe('isInvalid', () => {
    it('returns false while a control is pristine and untouched', async () => {
      const { component } = await setup();

      expect(component.isInvalid('login')).toBe(false);
    });

    it('returns true once an invalid control is touched', async () => {
      const { component } = await setup();
      component.form.controls.login.markAsTouched();

      expect(component.isInvalid('login')).toBe(true);
    });

    it('returns false when a touched control holds a valid value', async () => {
      const { component } = await setup();
      component.form.controls.login.setValue('user');
      component.form.controls.login.markAsTouched();

      expect(component.isInvalid('login')).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('marks the form touched and does not call the service when invalid', async () => {
      const { component, accounts } = await setup();

      component.onSubmit();

      expect(accounts.addSteamAccount).not.toHaveBeenCalled();
      expect(component.form.controls.login.touched).toBe(true);
    });

    it('navigates to the dashboard on a successful submission', async () => {
      const { component, accounts, navigateByUrl } = await setup();
      component.form.setValue(VALID_FORM);

      component.onSubmit();

      expect(accounts.addSteamAccount).toHaveBeenCalledWith(VALID_FORM);
      expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
      expect(component.submitting()).toBe(false);
    });

    it('does not re-submit while a request is already in flight', async () => {
      const { component, accounts } = await setup();
      component.form.setValue(VALID_FORM);
      accounts.addSteamAccount.mockReturnValueOnce(new Subject());

      component.onSubmit();
      component.onSubmit();

      expect(accounts.addSteamAccount).toHaveBeenCalledTimes(1);
      expect(component.submitting()).toBe(true);
    });

    it('sets the error key and clears submitting when the request fails', async () => {
      const { component, accounts, navigateByUrl } = await setup();
      component.form.setValue(VALID_FORM);
      accounts.addSteamAccount.mockReturnValueOnce(
        throwError(() => ({
          error: { errorKeys: ['errors.steam_account.invalid_credentials'] },
        })),
      );

      component.onSubmit();

      expect(component.errorKey()).toBe(
        'errors.steam_account.invalid_credentials',
      );
      expect(component.submitting()).toBe(false);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('setMode', () => {
    it('does nothing when the requested mode is already active', async () => {
      const { component, accounts } = await setup();

      component.setMode('credentials');

      expect(accounts.streamQrLogin).not.toHaveBeenCalled();
    });

    it('starts the qr login stream when switching to qr mode', async () => {
      const { component, accounts } = await setup();

      component.setMode('qr');

      expect(component.mode()).toBe('qr');
      expect(accounts.streamQrLogin).toHaveBeenCalledTimes(1);
      expect(component.qrStatus()).toBe('connecting');
    });

    it('resets the qr status to idle when switching back to credentials', async () => {
      const { component } = await setup();
      component.setMode('qr');

      component.setMode('credentials');

      expect(component.mode()).toBe('credentials');
      expect(component.qrStatus()).toBe('idle');
    });
  });

  describe('qr login stream', () => {
    it('shows the qr image and waits once a qr event arrives', async () => {
      const { component, qr } = await setup();
      component.setMode('qr');

      qr.next({
        event: QrLoginEventType.Qr,
        data: { qrDataUrl: 'data:image/png;base64,abc' },
      });

      expect(component.qrDataUrl()).toBe('data:image/png;base64,abc');
      expect(component.qrStatus()).toBe('waiting');
    });

    it('moves to the scanned status on a scanned event', async () => {
      const { component, qr } = await setup();
      component.setMode('qr');

      qr.next({ event: QrLoginEventType.Scanned, data: {} });

      expect(component.qrStatus()).toBe('scanned');
    });

    it('navigates to the dashboard once authenticated', async () => {
      const { component, qr, navigateByUrl } = await setup();
      component.setMode('qr');

      qr.next({
        event: QrLoginEventType.Authenticated,
        data: {} as never,
      });

      expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('surfaces the error key and status on a failed event', async () => {
      const { component, qr } = await setup();
      component.setMode('qr');

      qr.next({
        event: QrLoginEventType.Failed,
        data: { errorKey: 'errors.steam_account.qr_failed' },
      });

      expect(component.qrErrorKey()).toBe('errors.steam_account.qr_failed');
      expect(component.qrStatus()).toBe('error');
    });

    it('sets a connection error when the stream errors out', async () => {
      const { component, qr } = await setup();
      component.setMode('qr');

      qr.error(new Error('connection lost'));

      expect(component.qrErrorKey()).toBe('errors.steam_account.qr_failed');
      expect(component.qrStatus()).toBe('error');
    });

    it('restarts a fresh stream when startQrLogin is called again', async () => {
      const { component, accounts, qr } = await setup();
      component.setMode('qr');
      qr.error(new Error('boom'));

      accounts.streamQrLogin.mockReturnValueOnce(new Subject());
      component.startQrLogin();

      expect(accounts.streamQrLogin).toHaveBeenCalledTimes(2);
      expect(component.qrStatus()).toBe('connecting');
    });
  });
});
