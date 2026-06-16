import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';

import { DialogService, LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';
import { ConfirmDialogService } from '@steam-idler/client/infra/ui/dialog';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'si-settings',
  imports: [TranslatePipe, CardComponent],
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

  openChangePassword(): void {
    this.dialogService.open(ChangePasswordDialogComponent);
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
