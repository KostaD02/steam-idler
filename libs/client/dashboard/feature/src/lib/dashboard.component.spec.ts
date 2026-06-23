import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { LayoutService } from '@steam-idler/client/infra/core';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import {
  SteamAccountSummary,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

import { DashboardComponent } from './dashboard.component';

const sizing = {
  header: 70,
  innerPadding: 32,
  maxContentWidth: 1400,
  innerContentHeight: () => 'calc(100dvh - 134px)',
};

const buildAccount = (
  overrides: Partial<SteamAccountSummary['idleSettings']> = {},
  id = '1',
): SteamAccountSummary =>
  ({
    _id: id,
    accountName: 'bob',
    displayedGameName: '',
    updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    profile: { name: 'Bob', avatarUrl: '' },
    idleSettings: {
      idleEnabled: false,
      idleGameIds: [],
      personaStatus: SteamPersonaStatusEnum.Online,
      autoReply: { enabled: false, whileIdling: false, template: '' },
      ...overrides,
    },
  }) as unknown as SteamAccountSummary;

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const setup = async (
  options: {
    user?: unknown;
    accounts?: ReturnType<typeof of>;
  } = {},
) => {
  const auth = {
    user: jest
      .fn()
      .mockReturnValue(
        options.user === undefined ? { _id: 'u1' } : options.user,
      ),
  };
  const accountsService = {
    getSteamAccounts: jest
      .fn()
      .mockReturnValue(options.accounts ?? of([] as SteamAccountSummary[])),
  };

  await TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: AccountsService, useValue: accountsService },
      { provide: LayoutService, useValue: { sizing } },
      { provide: I18nService, useValue: buildI18nStub() },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<DashboardComponent> =
    TestBed.createComponent(DashboardComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, accountsService };
};

describe('DashboardComponent', () => {
  it('exposes the layout sizing config', async () => {
    const { component } = await setup();

    expect(component.sizing).toBe(sizing);
  });

  it('builds three skeleton placeholders', async () => {
    const { component } = await setup();

    expect(component.skeletons).toEqual([0, 1, 2]);
  });

  describe('accounts', () => {
    it('defaults to an empty list', async () => {
      const { component } = await setup();

      expect(component.accounts()).toEqual([]);
    });

    it('exposes the loaded accounts', async () => {
      const account = buildAccount();
      const { component } = await setup({ accounts: of([account]) });

      expect(component.accounts()).toEqual([account]);
    });
  });

  describe('stats', () => {
    it('counts totals, idling accounts and idled games', async () => {
      const accounts = [
        buildAccount({ idleEnabled: true, idleGameIds: [1, 2] }, '1'),
        buildAccount({ idleEnabled: false, idleGameIds: [3] }, '2'),
        buildAccount({ idleEnabled: true, idleGameIds: [4] }, '3'),
      ];
      const { component } = await setup({ accounts: of(accounts) });

      expect(component.stats()).toEqual({ total: 3, idling: 2, games: 3 });
    });

    it('returns zeroes when there are no accounts', async () => {
      const { component } = await setup({ accounts: of([]) });

      expect(component.stats()).toEqual({ total: 0, idling: 0, games: 0 });
    });
  });

  describe('hasError', () => {
    it('is false when the accounts load succeeds', async () => {
      const { component } = await setup({ accounts: of([]) });

      expect(component.hasError()).toBe(false);
    });

    it('is true when the accounts load fails', async () => {
      const { component } = await setup({
        accounts: throwError(() => new Error('boom')),
      });

      expect(component.hasError()).toBe(true);
    });
  });

  describe('reload', () => {
    it('re-runs the accounts request', async () => {
      const { fixture, component, accountsService } = await setup({
        accounts: of([]),
      });
      accountsService.getSteamAccounts.mockClear();

      component.reload();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(accountsService.getSteamAccounts).toHaveBeenCalled();
    });
  });
});
