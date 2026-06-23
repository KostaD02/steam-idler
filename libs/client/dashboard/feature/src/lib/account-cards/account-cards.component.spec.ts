import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  provideRouter,
  convertToParamMap,
  ParamMap,
} from '@angular/router';

import { of, throwError } from 'rxjs';

import {
  LayoutService,
  LocalStorageService,
} from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import {
  GameWithCards,
  SteamAccountSummary,
} from '@steam-idler/server/steam-account/types';

import { AccountCardsComponent } from './account-cards.component';

const buildGame = (overrides: Partial<GameWithCards> = {}): GameWithCards => ({
  appid: 10,
  name: 'Alpha',
  iconUrl: '',
  playtimeForever: 100,
  cardsRemaining: 2,
  ...overrides,
});

class StorageStub {
  private store = new Map<string, unknown>();
  getItem = jest.fn((key: string) => this.store.get(key) ?? null);
  setItem = jest.fn((key: string, value: unknown) => {
    this.store.set(key, value);
  });
  removeItem = jest.fn((key: string) => {
    this.store.delete(key);
  });
}

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const setup = async (
  options: {
    accountName?: string;
    cards?: ReturnType<typeof of>;
    accounts?: ReturnType<typeof of>;
    isMobile?: boolean;
    user?: unknown;
    storage?: StorageStub;
  } = {},
) => {
  const storage = options.storage ?? new StorageStub();
  const paramMap: ParamMap = convertToParamMap({
    accountName: options.accountName ?? 'bob',
  });
  const accountsService = {
    getCards: jest
      .fn()
      .mockReturnValue(options.cards ?? of([] as GameWithCards[])),
    getSteamAccounts: jest
      .fn()
      .mockReturnValue(options.accounts ?? of([] as SteamAccountSummary[])),
  };
  const auth = { user: jest.fn().mockReturnValue(options.user ?? null) };
  const layout = {
    isMobileView: jest.fn().mockReturnValue(options.isMobile ?? false),
  };

  await TestBed.configureTestingModule({
    imports: [AccountCardsComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(paramMap) },
      },
      { provide: AccountsService, useValue: accountsService },
      { provide: AuthService, useValue: auth },
      { provide: LayoutService, useValue: layout },
      { provide: LocalStorageService, useValue: storage },
      { provide: I18nService, useValue: buildI18nStub() },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<AccountCardsComponent> =
    TestBed.createComponent(AccountCardsComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return {
    fixture,
    component: fixture.componentInstance,
    accountsService,
    storage,
  };
};

describe('AccountCardsComponent', () => {
  describe('accountName', () => {
    it('reads the account name from the route', async () => {
      const { component } = await setup({ accountName: 'alice' });

      expect(component.accountName()).toBe('alice');
    });
  });

  describe('displayedColumns', () => {
    it('omits the index and appid columns in mobile view', async () => {
      const { component } = await setup({ isMobile: true });

      expect(component.displayedColumns()).toEqual([
        'game',
        'cardsRemaining',
        'playtimeForever',
      ]);
    });

    it('shows all columns in desktop view', async () => {
      const { component } = await setup({ isMobile: false });

      expect(component.displayedColumns()).toEqual([
        'index',
        'game',
        'appid',
        'cardsRemaining',
        'playtimeForever',
      ]);
    });
  });

  describe('rows', () => {
    it('sorts by the active column and direction', async () => {
      const cards = [
        buildGame({ appid: 1, name: 'Bravo', cardsRemaining: 1 }),
        buildGame({ appid: 2, name: 'Alpha', cardsRemaining: 5 }),
      ];
      const { component } = await setup({ cards: of(cards) });

      component.toggleSort('name');

      expect(component.rows().map((game) => game.name)).toEqual([
        'Alpha',
        'Bravo',
      ]);
    });

    it('filters by name or appid', async () => {
      const cards = [
        buildGame({ appid: 100, name: 'Alpha' }),
        buildGame({ appid: 200, name: 'Bravo' }),
      ];
      const { component } = await setup({ cards: of(cards) });

      component.setFilter('brav');

      expect(component.rows().map((game) => game.name)).toEqual(['Bravo']);

      component.setFilter('100');

      expect(component.rows().map((game) => game.appid)).toEqual([100]);
    });

    it('treats a null sort value as the lowest', async () => {
      const cards = [
        buildGame({ appid: 1, name: 'Alpha', cardsRemaining: null }),
        buildGame({ appid: 2, name: 'Bravo', cardsRemaining: 3 }),
      ];
      const { component } = await setup({ cards: of(cards) });

      expect(component.sortColumn()).toBe('cardsRemaining');
      expect(component.rows().map((game) => game.name)).toEqual([
        'Bravo',
        'Alpha',
      ]);
    });
  });

  describe('totalCards', () => {
    it('sums the remaining cards ignoring nulls', async () => {
      const cards = [
        buildGame({ cardsRemaining: 2 }),
        buildGame({ appid: 11, cardsRemaining: null }),
        buildGame({ appid: 12, cardsRemaining: 3 }),
      ];
      const { component } = await setup({ cards: of(cards) });

      expect(component.totalCards()).toBe(5);
    });
  });

  describe('errorKey', () => {
    it('is null when the cards load succeeds', async () => {
      const { component } = await setup({ cards: of([]) });

      expect(component.errorKey()).toBeNull();
    });

    it('extracts the error key when the cards load fails', async () => {
      const { component } = await setup({
        cards: throwError(
          () =>
            new HttpErrorResponse({
              error: { errorKeys: ['errors.cards'] },
              status: 400,
            }),
        ),
      });

      expect(component.errorKey()).toBe('errors.cards');
    });
  });

  describe('displayName', () => {
    it('falls back to the account name', async () => {
      const { component } = await setup({ accountName: 'bob' });

      expect(component.displayName()).toBe('bob');
    });

    it('uses the profile name when enabled and available', async () => {
      const accounts = [
        { accountName: 'bob', profile: { name: 'Bobby' } },
      ] as unknown as SteamAccountSummary[];
      const { component } = await setup({
        accountName: 'bob',
        accounts: of(accounts),
        user: { settings: { showProfileName: true } },
      });

      expect(component.displayName()).toBe('Bobby');
    });
  });

  describe('toggleSort', () => {
    it('flips the direction when the same column is toggled', async () => {
      const { component } = await setup();
      component.sortColumn.set('appid');
      component.sortDirection.set('asc');

      component.toggleSort('appid');

      expect(component.sortDirection()).toBe('desc');
    });

    it('defaults name ascending and other columns descending', async () => {
      const { component } = await setup();

      component.toggleSort('name');
      expect(component.sortDirection()).toBe('asc');

      component.toggleSort('appid');
      expect(component.sortDirection()).toBe('desc');
    });

    it('persists the sort to storage', async () => {
      const { component, storage } = await setup();

      component.toggleSort('appid');

      expect(storage.setItem).toHaveBeenCalledWith(StorageKeysEnum.CardsSort, {
        column: 'appid',
        direction: 'desc',
      });
    });
  });

  describe('sortIndicator', () => {
    it('returns an arrow for the active column and empty otherwise', async () => {
      const { component } = await setup();
      component.sortColumn.set('appid');
      component.sortDirection.set('asc');

      expect(component.sortIndicator('appid')).toBe('▲');
      expect(component.sortIndicator('name')).toBe('');

      component.sortDirection.set('desc');
      expect(component.sortIndicator('appid')).toBe('▼');
    });
  });

  describe('ariaSort', () => {
    it('maps the active direction and reports none otherwise', async () => {
      const { component } = await setup();
      component.sortColumn.set('appid');
      component.sortDirection.set('asc');

      expect(component.ariaSort('appid')).toBe('ascending');
      expect(component.ariaSort('name')).toBe('none');

      component.sortDirection.set('desc');
      expect(component.ariaSort('appid')).toBe('descending');
    });
  });

  describe('initial sort', () => {
    it('restores a saved sort from storage', async () => {
      const storage = new StorageStub();
      storage.setItem(StorageKeysEnum.CardsSort, {
        column: 'playtimeForever',
        direction: 'asc',
      });
      const { component } = await setup({ storage });

      expect(component.sortColumn()).toBe('playtimeForever');
      expect(component.sortDirection()).toBe('asc');
    });

    it('falls back to cardsRemaining descending when nothing is saved', async () => {
      const { component } = await setup();

      expect(component.sortColumn()).toBe('cardsRemaining');
      expect(component.sortDirection()).toBe('desc');
    });
  });
});
