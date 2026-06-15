import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

import { AccountCardComponent } from './account-card/account-card.component';

const SKELETON_COUNT = 3;

@Component({
  selector: 'si-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [RouterLink, TranslatePipe, CardComponent, AccountCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly accountsService = inject(AccountsService);

  readonly user = this.authService.user;
  readonly sizing = this.layoutService.sizing;

  readonly skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

  private readonly accountsResource = rxResource({
    params: () => this.user()?._id,
    stream: () => this.accountsService.getSteamAccounts(),
  });

  readonly accounts = computed(() => this.accountsResource.value() ?? []);

  readonly isInitialLoad = computed(
    () => this.accountsResource.status() === 'loading',
  );
  readonly hasError = computed(
    () => this.accountsResource.error() !== undefined,
  );

  readonly stats = computed(() => {
    const accounts = this.accounts();
    const idling = accounts.filter(
      (account) => account.idleSettings.idleEnabled,
    );
    const games = idling.reduce(
      (total, account) => total + account.idleSettings.idleGameIds.length,
      0,
    );

    return { total: accounts.length, idling: idling.length, games };
  });

  reload(): void {
    this.accountsResource.reload();
  }
}
