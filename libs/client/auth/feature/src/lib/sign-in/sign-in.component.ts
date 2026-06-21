import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { catchError, EMPTY, finalize, tap } from 'rxjs';

import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-sign-in',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-in.component.html',
  styleUrl: '../auth-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly mfaRequired = signal(false);

  readonly form = this.fb.group({
    email: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
    ]),
    password: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  readonly mfaForm = this.fb.group({
    token: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  isMfaInvalid(): boolean {
    const control = this.mfaForm.controls.token;
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
      .signIn(this.form.getRawValue())
      .pipe(
        tap((result) => {
          if ('mfaRequired' in result) {
            this.mfaRequired.set(true);
            return;
          }

          this.router.navigateByUrl('/dashboard');
        }),
        catchError((err: HttpErrorResponse) => {
          this.errorKey.set(extractErrorKey(err));
          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe();
  }

  onMfaSubmit(): void {
    if (this.mfaForm.invalid || this.submitting()) {
      this.mfaForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set(null);

    this.authService
      .mfaAuthenticate(this.mfaForm.getRawValue().token)
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
}
