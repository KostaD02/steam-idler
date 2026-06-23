import { DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { catchError, EMPTY, finalize, tap } from 'rxjs';

import { DialogComponent } from '@steam-idler/client/infra/ui/dialog';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

type SetupStep = 'loading' | 'enroll' | 'recovery';

@Component({
  selector: 'si-mfa-setup-dialog',
  imports: [ReactiveFormsModule, DialogComponent, TranslatePipe],
  templateUrl: './mfa-setup-dialog.component.html',
  styleUrl: './mfa-setup-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaSetupDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  readonly step = signal<SetupStep>('loading');
  readonly qrDataUrl = signal<string | null>(null);
  readonly secret = signal<string | null>(null);
  readonly otpauthUrl = signal<string | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly loadErrorKey = signal<string | null>(null);

  readonly keyType = computed<'time' | 'counter' | null>(() => {
    const url = this.otpauthUrl();

    if (!url) {
      return null;
    }

    return url.toLowerCase().startsWith('otpauth://hotp') ? 'counter' : 'time';
  });

  readonly form = this.fb.group({
    token: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  ngOnInit(): void {
    this.authService
      .generateMfa()
      .pipe(
        tap((res) => {
          this.qrDataUrl.set(res.qrDataUrl);
          this.secret.set(res.secret);
          this.otpauthUrl.set(res.otpauthUrl);
          this.step.set('enroll');
        }),
        catchError((err: HttpErrorResponse) => {
          this.loadErrorKey.set(extractErrorKey(err));

          return EMPTY;
        }),
      )
      .subscribe();
  }

  isInvalid(): boolean {
    const control = this.form.controls.token;

    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();

      return;
    }

    this.submitting.set(true);
    this.errorKey.set(null);

    this.authService
      .enableMfa(this.form.getRawValue().token)
      .pipe(
        tap((res) => {
          this.recoveryCodes.set(res.recoveryCodes);
          this.step.set('recovery');
        }),
        catchError((err: HttpErrorResponse) => {
          this.errorKey.set(extractErrorKey(err));

          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe();
  }

  done(): void {
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
