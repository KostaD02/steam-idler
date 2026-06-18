import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { catchError, EMPTY, finalize, Subject, switchMap, tap } from 'rxjs';

import { LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import {
  AccountsService,
  QrLoginStreamEvent,
} from '@steam-idler/client/accounts/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';
import { QrLoginEventType } from '@steam-idler/server/steam-account/types';

const TWO_FACTOR_CODE_LENGTH = 5;
const QR_CONNECTION_ERROR_KEY = 'errors.steam_account.qr_failed';

type AccountMode = 'credentials' | 'qr';
type QrStatus = 'idle' | 'connecting' | 'waiting' | 'scanned' | 'error';

@Component({
  selector: 'si-accounts',
  imports: [ReactiveFormsModule, TranslatePipe, CardComponent],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly accountsService = inject(AccountsService);
  private readonly layoutService = inject(LayoutService);

  readonly sizing = this.layoutService.sizing;
  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);

  readonly mode = signal<AccountMode>('credentials');
  readonly qrStatus = signal<QrStatus>('idle');
  readonly qrDataUrl = signal<string | null>(null);
  readonly qrErrorKey = signal<string | null>(null);

  private readonly qrSession$ = new Subject<boolean>();

  readonly form = this.fb.group({
    login: this.fb.nonNullable.control('', [Validators.required]),
    password: this.fb.nonNullable.control('', [Validators.required]),
    twoFactorCode: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(TWO_FACTOR_CODE_LENGTH),
      Validators.maxLength(TWO_FACTOR_CODE_LENGTH),
    ]),
  });

  constructor() {
    this.qrSession$
      .pipe(
        switchMap((active) => {
          if (!active) {
            return EMPTY;
          }

          this.qrErrorKey.set(null);
          this.qrDataUrl.set(null);
          this.qrStatus.set('connecting');

          return this.accountsService.streamQrLogin().pipe(
            tap((event) => this.handleQrEvent(event)),
            catchError(() => {
              this.qrErrorKey.set(QR_CONNECTION_ERROR_KEY);
              this.qrStatus.set('error');

              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  setMode(mode: AccountMode): void {
    if (this.mode() === mode) {
      return;
    }

    this.mode.set(mode);

    if (mode === 'qr') {
      this.startQrLogin();

      return;
    }

    this.qrSession$.next(false);
    this.qrStatus.set('idle');
  }

  startQrLogin(): void {
    this.qrSession$.next(true);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set(null);

    this.accountsService
      .addSteamAccount(this.form.getRawValue())
      .pipe(
        tap(() => this.router.navigateByUrl('/dashboard')),
        catchError((err: HttpErrorResponse) => {
          this.errorKey.set(extractErrorKey(err));
          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe();
  }

  private handleQrEvent(event: QrLoginStreamEvent): void {
    switch (event.event) {
      case QrLoginEventType.Qr:
        this.qrDataUrl.set(event.data.qrDataUrl);
        this.qrStatus.set('waiting');

        break;

      case QrLoginEventType.Scanned:
        this.qrStatus.set('scanned');

        break;

      case QrLoginEventType.Authenticated:
        this.qrSession$.next(false);
        this.router.navigateByUrl('/dashboard');

        break;

      case QrLoginEventType.Failed:
        this.qrErrorKey.set(event.data.errorKey);
        this.qrStatus.set('error');
        this.qrSession$.next(false);

        break;
    }
  }
}
