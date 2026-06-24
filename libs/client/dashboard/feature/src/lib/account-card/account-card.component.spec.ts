import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EMPTY, of, Subject, throwError } from 'rxjs';

import { DialogService } from '@steam-idler/client/infra/core';
import { ConfirmDialogService } from '@steam-idler/client/infra/ui/dialog';

import { AccountsService } from '@steam-idler/client/accounts/data-access';
import { AuthService } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';
import {
  SteamAccountSummary,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

import { AccountCardComponent } from './account-card.component';

const buildAccount = (
  overrides: Partial<SteamAccountSummary> = {},
): SteamAccountSummary =>
  ({
    accountName: 'bob',
    displayedGameName: 'Half-Life',
    updatedAt: new Date().toISOString(),
    profile: { name: 'Bob', avatarUrl: 'http://img/avatar.png' },
    idleSettings: {
      idleEnabled: false,
      idleGameIds: [10, 20],
      personaStatus: SteamPersonaStatusEnum.Online,
      autoReply: { enabled: false, whileIdling: false, template: '' },
    },
    ...overrides,
  }) as unknown as SteamAccountSummary;

const buildAccountsStub = () => ({
  startIdling: jest.fn().mockReturnValue(of({})),
  stopIdling: jest.fn().mockReturnValue(of({})),
  updateIdleGames: jest.fn().mockReturnValue(of({})),
  updateDisplayedGameName: jest.fn().mockReturnValue(of({})),
  updatePersona: jest.fn().mockReturnValue(of({})),
  startAutoReply: jest.fn().mockReturnValue(of({})),
  stopAutoReply: jest.fn().mockReturnValue(of({})),
  updateAutoReply: jest.fn().mockReturnValue(of({})),
  removeSteamAccount: jest.fn().mockReturnValue(of({})),
});

type AccountsStub = ReturnType<typeof buildAccountsStub>;

const buildDialogStub = (closed = of(undefined)) => ({
  open: jest.fn().mockReturnValue({ closed }),
});

const buildConfirmStub = (result = of(false)) => ({
  confirm: jest.fn().mockReturnValue(result),
});

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const setup = async (
  options: {
    account?: SteamAccountSummary;
    user?: unknown;
    dialogClosed?: ReturnType<typeof of>;
    confirmResult?: ReturnType<typeof of>;
  } = {},
) => {
  const accounts = buildAccountsStub();
  const dialog = buildDialogStub(options.dialogClosed ?? of(undefined));
  const confirm = buildConfirmStub(options.confirmResult ?? of(false));
  const auth = { user: jest.fn().mockReturnValue(options.user ?? null) };

  await TestBed.configureTestingModule({
    imports: [AccountCardComponent],
    providers: [
      provideRouter([]),
      { provide: AccountsService, useValue: accounts },
      { provide: DialogService, useValue: dialog },
      { provide: ConfirmDialogService, useValue: confirm },
      { provide: I18nService, useValue: buildI18nStub() },
      { provide: AuthService, useValue: auth },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<AccountCardComponent> =
    TestBed.createComponent(AccountCardComponent);
  fixture.componentRef.setInput('account', options.account ?? buildAccount());
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    accounts: accounts as AccountsStub,
    dialog,
    confirm,
  };
};

describe('AccountCardComponent', () => {
  describe('derived state', () => {
    it('exposes the games count and start eligibility', async () => {
      const { component } = await setup();

      expect(component.gamesCount()).toBe(2);
      expect(component.canStart()).toBe(true);
    });

    it('cannot start when there are no idle games', async () => {
      const { component } = await setup({
        account: buildAccount({
          idleSettings: {
            idleEnabled: false,
            idleGameIds: [],
            personaStatus: SteamPersonaStatusEnum.Online,
            autoReply: { enabled: false, whileIdling: false, template: '' },
          },
        }),
      });

      expect(component.gamesCount()).toBe(0);
      expect(component.canStart()).toBe(false);
    });

    it('reflects the idling and auto-reply flags', async () => {
      const { component } = await setup({
        account: buildAccount({
          idleSettings: {
            idleEnabled: true,
            idleGameIds: [10],
            personaStatus: SteamPersonaStatusEnum.Away,
            autoReply: { enabled: true, whileIdling: false, template: '' },
          },
        }),
      });

      expect(component.isIdling()).toBe(true);
      expect(component.autoReplyEnabled()).toBe(true);
      expect(component.personaStatus()).toBe(SteamPersonaStatusEnum.Away);
    });
  });

  describe('avatarUrl', () => {
    it('is null when the profile image setting is off', async () => {
      const { component } = await setup({
        user: { settings: { showProfileImage: false } },
      });

      expect(component.avatarUrl()).toBeNull();
    });

    it('returns the avatar when the profile image setting is on', async () => {
      const { component } = await setup({
        user: { settings: { showProfileImage: true } },
      });

      expect(component.avatarUrl()).toBe('http://img/avatar.png');
    });
  });

  describe('displayName', () => {
    it('uses the account name by default', async () => {
      const { component } = await setup();

      expect(component.displayName()).toBe('bob');
    });

    it('uses the profile name when the setting is on', async () => {
      const { component } = await setup({
        user: { settings: { showProfileName: true } },
      });

      expect(component.displayName()).toBe('Bob');
    });

    it('masks the name when the mask setting is on', async () => {
      const { component } = await setup({
        user: { settings: { maskAccountName: true } },
      });

      expect(component.displayName()).toBe('b**');
    });
  });

  describe('toggleIdling', () => {
    it('starts idling when currently paused', async () => {
      const { component, accounts } = await setup();

      component.toggleIdling();

      expect(accounts.startIdling).toHaveBeenCalledWith('bob');
      expect(accounts.stopIdling).not.toHaveBeenCalled();
    });

    it('stops idling when currently active', async () => {
      const { component, accounts } = await setup({
        account: buildAccount({
          idleSettings: {
            idleEnabled: true,
            idleGameIds: [10],
            personaStatus: SteamPersonaStatusEnum.Online,
            autoReply: { enabled: false, whileIdling: false, template: '' },
          },
        }),
      });

      component.toggleIdling();

      expect(accounts.stopIdling).toHaveBeenCalledWith('bob');
    });

    it('emits changed and clears busy on success', async () => {
      const { component, accounts } = await setup();
      const changed = jest.fn();
      component.changed.subscribe(changed);
      accounts.startIdling.mockReturnValueOnce(of({}));

      component.toggleIdling();

      expect(changed).toHaveBeenCalled();
      expect(component.busy()).toBe(false);
    });

    it('captures the error key and clears busy on failure', async () => {
      const { component, accounts } = await setup();
      accounts.startIdling.mockReturnValueOnce(
        throwError(() => ({ error: { errorKeys: ['errors.boom'] } })),
      );

      component.toggleIdling();

      expect(component.errorKey()).toBe('errors.boom');
      expect(component.busy()).toBe(false);
    });

    it('keeps busy true while the action is in flight', async () => {
      const { component, accounts } = await setup();
      accounts.startIdling.mockReturnValueOnce(new Subject());

      component.toggleIdling();

      expect(component.busy()).toBe(true);
    });
  });

  describe('changePersona', () => {
    it('updates the persona for the account', async () => {
      const { component, accounts } = await setup();

      component.changePersona(SteamPersonaStatusEnum.Busy);

      expect(accounts.updatePersona).toHaveBeenCalledWith('bob', {
        personaStatus: SteamPersonaStatusEnum.Busy,
      });
    });
  });

  describe('toggleAutoReply', () => {
    it('starts auto-reply when currently off', async () => {
      const { component, accounts } = await setup();

      component.toggleAutoReply();

      expect(accounts.startAutoReply).toHaveBeenCalledWith('bob');
    });

    it('stops auto-reply when currently on', async () => {
      const { component, accounts } = await setup({
        account: buildAccount({
          idleSettings: {
            idleEnabled: false,
            idleGameIds: [10],
            personaStatus: SteamPersonaStatusEnum.Online,
            autoReply: { enabled: true, whileIdling: false, template: '' },
          },
        }),
      });

      component.toggleAutoReply();

      expect(accounts.stopAutoReply).toHaveBeenCalledWith('bob');
    });
  });

  describe('editGames', () => {
    it('updates idle games when the dialog returns ids', async () => {
      const { component, accounts, dialog } = await setup({
        dialogClosed: of([1, 2, 3]),
      });

      component.editGames();

      expect(dialog.open).toHaveBeenCalled();
      expect(accounts.updateIdleGames).toHaveBeenCalledWith('bob', {
        gamesIds: [1, 2, 3],
      });
    });

    it('does nothing when the dialog is dismissed', async () => {
      const { component, accounts } = await setup({
        dialogClosed: of(undefined),
      });

      component.editGames();

      expect(accounts.updateIdleGames).not.toHaveBeenCalled();
    });
  });

  describe('editNowPlaying', () => {
    it('updates the displayed game when the dialog returns a name', async () => {
      const { component, accounts } = await setup({
        dialogClosed: of('New Game'),
      });

      component.editNowPlaying();

      expect(accounts.updateDisplayedGameName).toHaveBeenCalledWith('bob', {
        displayedGameName: 'New Game',
      });
    });

    it('updates the displayed game when the dialog returns an empty string', async () => {
      const { component, accounts } = await setup({ dialogClosed: of('') });

      component.editNowPlaying();

      expect(accounts.updateDisplayedGameName).toHaveBeenCalledWith('bob', {
        displayedGameName: '',
      });
    });

    it('does nothing when the dialog is dismissed', async () => {
      const { component, accounts } = await setup({
        dialogClosed: of(undefined),
      });

      component.editNowPlaying();

      expect(accounts.updateDisplayedGameName).not.toHaveBeenCalled();
    });
  });

  describe('editAutoReply', () => {
    it('updates the auto-reply when the dialog returns a result', async () => {
      const result = { template: 'Hi', whileIdling: true };
      const { component, accounts } = await setup({ dialogClosed: of(result) });

      component.editAutoReply();

      expect(accounts.updateAutoReply).toHaveBeenCalledWith('bob', result);
    });

    it('does nothing when the dialog is dismissed', async () => {
      const { component, accounts } = await setup({
        dialogClosed: of(undefined),
      });

      component.editAutoReply();

      expect(accounts.updateAutoReply).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes the account when the user confirms', async () => {
      const { component, accounts } = await setup({ confirmResult: of(true) });

      component.remove();

      expect(accounts.removeSteamAccount).toHaveBeenCalledWith('bob');
    });

    it('does nothing when the user declines', async () => {
      const { component, accounts } = await setup({ confirmResult: of(false) });

      component.remove();

      expect(accounts.removeSteamAccount).not.toHaveBeenCalled();
    });
  });

  describe('run error handling', () => {
    it('leaves the error key null on a successful action', async () => {
      const { component, accounts } = await setup();
      accounts.startIdling.mockReturnValueOnce(EMPTY);

      component.toggleIdling();

      expect(component.errorKey()).toBeNull();
    });
  });
});
