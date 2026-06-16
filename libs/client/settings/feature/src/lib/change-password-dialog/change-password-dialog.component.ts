import { DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { catchError, EMPTY, finalize, tap } from 'rxjs';

import { DialogComponent } from '@steam-idler/client/infra/ui/dialog';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'si-change-password-dialog',
  imports: [ReactiveFormsModule, DialogComponent, TranslatePipe],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  readonly minLength = PASSWORD_MIN_LENGTH;
  readonly maxLength = PASSWORD_MAX_LENGTH;

  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      oldPassword: this.fb.nonNullable.control('', [Validators.required]),
      newPassword: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(this.minLength),
        Validators.maxLength(this.maxLength),
      ]),
      confirmPassword: this.fb.nonNullable.control('', [Validators.required]),
    },
    { validators: passwordsMatch },
  );

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  isMismatch(): boolean {
    const confirm = this.form.controls.confirmPassword;

    return (
      this.form.hasError('passwordsMismatch') &&
      confirm.value.length > 0 &&
      (confirm.dirty || confirm.touched)
    );
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();

      return;
    }

    const { oldPassword, newPassword } = this.form.getRawValue();

    this.submitting.set(true);
    this.errorKey.set(null);

    this.authService
      .changePassword({ oldPassword, newPassword })
      .pipe(
        tap(() => this.dialogRef.close(true)),
        catchError((err: HttpErrorResponse) => {
          this.errorKey.set(extractErrorKey(err));

          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe();
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
