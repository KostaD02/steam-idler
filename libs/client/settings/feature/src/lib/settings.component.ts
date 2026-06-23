import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { catchError, EMPTY, filter, finalize, switchMap, tap } from 'rxjs';

import { DialogService, LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';
import { ConfirmDialogService } from '@steam-idler/client/infra/ui/dialog';
import { ToggleComponent } from '@steam-idler/client/infra/ui/toggle';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';
import {
  UpdateUserSettingsDto,
  UserSettings,
} from '@steam-idler/server/auth/types';

import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { MfaDisableDialogComponent } from './mfa-disable-dialog/mfa-disable-dialog.component';
import { MfaSetupDialogComponent } from './mfa-setup-dialog/mfa-setup-dialog.component';

@Component({
  selector: 'si-settings',
  imports: [TranslatePipe, CardComponent, ToggleComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly user = this.authService.user;
  readonly sizing = this.layoutService.sizing;
  readonly errorKey = signal<string | null>(null);
  readonly saving = signal(false);

  readonly settings = computed<UserSettings>(
    () =>
      this.user()?.settings ?? {
        showProfileName: true,
        showProfileImage: true,
        maskAccountName: false,
      },
  );

  openChangePassword(): void {
    this.dialogService.open(ChangePasswordDialogComponent);
  }

  openMfaSetup(): void {
    this.dialogService.open(MfaSetupDialogComponent);
  }

  openMfaDisable(): void {
    this.dialogService.open(MfaDisableDialogComponent);
  }

  updateSetting(dto: UpdateUserSettingsDto): void {
    this.errorKey.set(null);
    this.saving.set(true);

    this.authService
      .updateSettings(dto)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.errorKey.set(extractErrorKey(err));

          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe();
  }

  deleteAccount(): void {
    this.confirmDialog
      .confirm({
        title: this.i18n.t('ui.settings.delete_account.confirm.title'),
        body: this.i18n.t('ui.settings.delete_account.confirm.body'),
        okLabel: this.i18n.t('ui.settings.delete_account.confirm.ok'),
        closeLabel: this.i18n.t('ui.settings.delete_account.confirm.cancel'),
        danger: true,
      })
      .pipe(
        filter((confirmed) => confirmed),
        tap(() => this.errorKey.set(null)),
        switchMap(() => this.authService.deleteUser()),
        tap(() => this.router.navigateByUrl('/auth/sign-in')),
        catchError((err: HttpErrorResponse) => {
          this.errorKey.set(extractErrorKey(err));

          return EMPTY;
        }),
      )
      .subscribe();
  }
}
