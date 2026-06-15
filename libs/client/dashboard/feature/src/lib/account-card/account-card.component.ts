import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import { formatRelativeTime } from '@steam-idler/infra';

import { DialogService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';
import { ConfirmDialogService } from '@steam-idler/client/infra/ui/dialog';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';
import {
  SteamAccountSummary,
  SteamPersonaStatus,
} from '@steam-idler/server/steam-account/types';

import {
  EditAutoReplyDialogComponent,
  EditAutoReplyDialogData,
} from '../edit-auto-reply-dialog/edit-auto-reply-dialog.component';
import {
  EditDisplayedGameDialogComponent,
  EditDisplayedGameDialogData,
} from '../edit-displayed-game-dialog/edit-displayed-game-dialog.component';
import {
  EditGamesDialogComponent,
  EditGamesDialogData,
} from '../edit-games-dialog/edit-games-dialog.component';
import { PersonaSelectComponent } from '../persona-select/persona-select.component';

@Component({
  selector: 'si-account-card',
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.scss',
  imports: [CardComponent, TranslatePipe, PersonaSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountCardComponent {
  private readonly accountsService = inject(AccountsService);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(I18nService);

  readonly account = input.required<SteamAccountSummary>();

  readonly changed = output<void>();

  readonly busy = signal(false);
  readonly errorKey = signal<string | null>(null);

  readonly isIdling = computed(() => this.account().idleSettings.idleEnabled);

  readonly gamesCount = computed(
    () => this.account().idleSettings.idleGameIds.length,
  );

  readonly canStart = computed(() => this.gamesCount() > 0);

  readonly autoReplyEnabled = computed(
    () => this.account().idleSettings.autoReply.enabled,
  );

  readonly lastUpdated = computed(() =>
    formatRelativeTime(this.account().updatedAt),
  );

  readonly personaStatus = computed(
    () => this.account().idleSettings.personaStatus,
  );

  toggleIdling(): void {
    const account = this.account();
    const action$ = account.idleSettings.idleEnabled
      ? this.accountsService.stopIdling(account.accountName)
      : this.accountsService.startIdling(account.accountName);

    this.run(action$);
  }

  editGames(): void {
    const account = this.account();

    this.dialogService
      .open<number[], EditGamesDialogData>(EditGamesDialogComponent, {
        data: {
          accountName: account.accountName,
          gameIds: account.idleSettings.idleGameIds,
        },
      })
      .closed.pipe(
        tap((gamesIds) => {
          if (!gamesIds) {
            return;
          }

          this.run(
            this.accountsService.updateIdleGames(account.accountName, {
              gamesIds,
            }),
          );
        }),
      )
      .subscribe();
  }

  editNowPlaying(): void {
    const account = this.account();

    this.dialogService
      .open<string, EditDisplayedGameDialogData>(
        EditDisplayedGameDialogComponent,
        {
          data: {
            accountName: account.accountName,
            displayedGameName: account.displayedGameName,
          },
        },
      )
      .closed.pipe(
        tap((displayedGameName) => {
          if (displayedGameName === undefined) {
            return;
          }

          this.run(
            this.accountsService.updateDisplayedGameName(account.accountName, {
              displayedGameName,
            }),
          );
        }),
      )
      .subscribe();
  }

  changePersona(personaStatus: SteamPersonaStatus): void {
    this.run(
      this.accountsService.updatePersona(this.account().accountName, {
        personaStatus,
      }),
    );
  }

  toggleAutoReply(): void {
    const account = this.account();
    const action$ = account.idleSettings.autoReply.enabled
      ? this.accountsService.stopAutoReply(account.accountName)
      : this.accountsService.startAutoReply(account.accountName);

    this.run(action$);
  }

  editAutoReply(): void {
    const account = this.account();
    const autoReply = account.idleSettings.autoReply;

    this.dialogService
      .open<
        { template: string; whileIdling: boolean },
        EditAutoReplyDialogData
      >(EditAutoReplyDialogComponent, {
        data: {
          accountName: account.accountName,
          template: autoReply.template,
          whileIdling: autoReply.whileIdling,
        },
      })
      .closed.pipe(
        tap((result) => {
          if (!result) {
            return;
          }

          this.run(
            this.accountsService.updateAutoReply(account.accountName, result),
          );
        }),
      )
      .subscribe();
  }

  remove(): void {
    const account = this.account();

    this.confirmDialog
      .confirm({
        title: this.i18n.t('ui.dashboard.remove_confirm.title'),
        body: this.i18n.t('ui.dashboard.remove_confirm.body'),
        okLabel: this.i18n.t('ui.dashboard.remove_confirm.ok'),
        closeLabel: this.i18n.t('ui.dashboard.remove_confirm.cancel'),
        danger: true,
      })
      .pipe(
        tap((confirmed) => {
          if (!confirmed) {
            return;
          }

          this.run(
            this.accountsService.removeSteamAccount(account.accountName),
          );
        }),
      )
      .subscribe();
  }

  private run(action$: Observable<unknown>): void {
    this.busy.set(true);
    this.errorKey.set(null);

    action$
      .pipe(
        catchError((err) => {
          this.errorKey.set(extractErrorKey(err));
          return EMPTY;
        }),
        finalize(() => this.busy.set(false)),
        tap(() => this.changed.emit()),
      )
      .subscribe();
  }
}
