import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { catchError, EMPTY, finalize, tap } from 'rxjs';

import { LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

const TWO_FACTOR_CODE_LENGTH = 5;

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

  readonly form = this.fb.group({
    login: this.fb.nonNullable.control('', [Validators.required]),
    password: this.fb.nonNullable.control('', [Validators.required]),
    twoFactorCode: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(TWO_FACTOR_CODE_LENGTH),
      Validators.maxLength(TWO_FACTOR_CODE_LENGTH),
    ]),
  });

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
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
}
