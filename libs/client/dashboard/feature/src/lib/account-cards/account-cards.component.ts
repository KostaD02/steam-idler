import { CdkTableModule } from '@angular/cdk/table';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { map } from 'rxjs';

import { formatPlaytime, maskString } from '@steam-idler/infra';

import {
  LayoutService,
  LocalStorageService,
} from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';
import { extractErrorKey } from '@steam-idler/client/infra/util';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

type SortColumn = 'name' | 'appid' | 'cardsRemaining' | 'playtimeForever';
type SortDirection = 'asc' | 'desc';

const SORT_COLUMNS: readonly SortColumn[] = [
  'name',
  'appid',
  'cardsRemaining',
  'playtimeForever',
];

@Component({
  selector: 'si-account-cards',
  templateUrl: './account-cards.component.html',
  styleUrl: './account-cards.component.scss',
  imports: [CdkTableModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountCardsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly accountsService = inject(AccountsService);
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly storage = inject(LocalStorageService);

  protected readonly formatPlaytime = formatPlaytime;

  readonly displayedColumns = computed(() =>
    this.layoutService.isMobileView()
      ? ['game', 'cardsRemaining', 'playtimeForever']
      : ['index', 'game', 'appid', 'cardsRemaining', 'playtimeForever'],
  );

  readonly accountName = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('accountName') ?? '')),
    { initialValue: '' },
  );

  readonly filter = signal('');

  private readonly initialSort = this.readSort();
  readonly sortColumn = signal<SortColumn>(this.initialSort.column);
  readonly sortDirection = signal<SortDirection>(this.initialSort.direction);

  private readonly cardsResource = rxResource({
    params: () => this.accountName() || undefined,
    stream: ({ params }) => this.accountsService.getCards(params),
  });

  private readonly accountsResource = rxResource({
    params: () => this.accountName() || undefined,
    stream: () => this.accountsService.getSteamAccounts(),
  });

  private readonly account = computed(() =>
    (this.accountsResource.value() ?? []).find(
      (account) => account.accountName === this.accountName(),
    ),
  );

  private readonly settings = computed(() => this.authService.user()?.settings);

  readonly avatarUrl = computed(() => {
    const avatar = this.account()?.profile?.avatarUrl;

    return this.settings()?.showProfileImage && avatar ? avatar : null;
  });

  readonly displayName = computed(() => {
    const settings = this.settings();
    const profileName = this.account()?.profile?.name;

    const name =
      settings?.showProfileName && profileName
        ? profileName
        : this.accountName();

    return settings?.maskAccountName ? maskString(name) : name;
  });

  readonly loading = computed(() => this.cardsResource.status() === 'loading');

  readonly errorKey = computed(() => {
    const error = this.cardsResource.error();

    return error ? extractErrorKey(error) : null;
  });

  protected readonly games = computed(() => this.cardsResource.value() ?? []);

  readonly rows = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    const filtered = term
      ? this.games().filter(
          (game) =>
            game.name.toLowerCase().includes(term) ||
            String(game.appid).includes(term),
        )
      : [...this.games()];

    return filtered.sort((a, b) => {
      if (column === 'name') {
        return a.name.localeCompare(b.name) * direction;
      }

      return (a[column] - b[column]) * direction;
    });
  });

  readonly totalCards = computed(() =>
    this.games().reduce((total, game) => total + game.cardsRemaining, 0),
  );

  setFilter(value: string): void {
    this.filter.set(value);
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) =>
        direction === 'asc' ? 'desc' : 'asc',
      );
      this.persistSort();

      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set(column === 'name' ? 'asc' : 'desc');
    this.persistSort();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return '';
    }

    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  ariaSort(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  private readSort(): { column: SortColumn; direction: SortDirection } {
    const saved = this.storage.getItem(StorageKeysEnum.CardsSort) as {
      column?: string;
      direction?: string;
    } | null;

    const column = SORT_COLUMNS.includes(saved?.column as SortColumn)
      ? (saved?.column as SortColumn)
      : 'cardsRemaining';
    const direction: SortDirection =
      saved?.direction === 'asc' ? 'asc' : 'desc';

    return { column, direction };
  }

  private persistSort(): void {
    this.storage.setItem(StorageKeysEnum.CardsSort, {
      column: this.sortColumn(),
      direction: this.sortDirection(),
    });
  }
}
