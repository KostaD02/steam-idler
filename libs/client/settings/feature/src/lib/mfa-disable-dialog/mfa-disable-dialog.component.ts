import { DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { catchError, EMPTY, finalize, tap } from 'rxjs';

import { DialogComponent } from '@steam-idler/client/infra/ui/dialog';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-mfa-disable-dialog',
  imports: [ReactiveFormsModule, DialogComponent, TranslatePipe],
  templateUrl: './mfa-disable-dialog.component.html',
  styleUrl: './mfa-disable-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaDisableDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);

  readonly form = this.fb.group({
    token: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

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
      .disableMfa(this.form.getRawValue().token)
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
