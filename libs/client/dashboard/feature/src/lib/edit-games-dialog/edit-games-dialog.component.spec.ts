import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';

import {
  EditGamesDialogComponent,
  EditGamesDialogData,
} from './edit-games-dialog.component';

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const setup = async (data: EditGamesDialogData) => {
  const close = jest.fn();

  await TestBed.configureTestingModule({
    imports: [EditGamesDialogComponent],
    providers: [
      { provide: DialogRef, useValue: { close } },
      { provide: DIALOG_DATA, useValue: data },
      { provide: I18nService, useValue: buildI18nStub() },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<EditGamesDialogComponent> =
    TestBed.createComponent(EditGamesDialogComponent);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, close };
};

describe('EditGamesDialogComponent', () => {
  it('seeds the ids from the dialog data', async () => {
    const { component } = await setup({
      accountName: 'bob',
      gameIds: [10, 20],
    });

    expect(component.ids()).toEqual([10, 20]);
  });

  describe('add', () => {
    it('appends a valid new id and resets the control', async () => {
      const { component } = await setup({ accountName: 'bob', gameIds: [10] });
      component.newId.setValue(30);

      component.add();

      expect(component.ids()).toEqual([10, 30]);
      expect(component.newId.value).toBeNull();
    });

    it('ignores a null value', async () => {
      const { component } = await setup({ accountName: 'bob', gameIds: [10] });
      component.newId.setValue(null);

      component.add();

      expect(component.ids()).toEqual([10]);
    });

    it('ignores a non-integer value', async () => {
      const { component } = await setup({ accountName: 'bob', gameIds: [10] });
      component.newId.setValue(1.5);

      component.add();

      expect(component.ids()).toEqual([10]);
    });

    it('ignores a non-positive value', async () => {
      const { component } = await setup({ accountName: 'bob', gameIds: [10] });
      component.newId.setValue(0);

      component.add();

      expect(component.ids()).toEqual([10]);
    });

    it('does not duplicate an id that is already present', async () => {
      const { component } = await setup({ accountName: 'bob', gameIds: [10] });
      component.newId.setValue(10);

      component.add();

      expect(component.ids()).toEqual([10]);
    });
  });

  describe('removeId', () => {
    it('removes the matching id', async () => {
      const { component } = await setup({
        accountName: 'bob',
        gameIds: [10, 20, 30],
      });

      component.removeId(20);

      expect(component.ids()).toEqual([10, 30]);
    });
  });

  describe('save', () => {
    it('closes the dialog with the current ids', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        gameIds: [10, 20],
      });
      component.newId.setValue(30);
      component.add();

      component.save();

      expect(close).toHaveBeenCalledWith([10, 20, 30]);
    });
  });

  describe('close', () => {
    it('closes the dialog without a value', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        gameIds: [],
      });

      component.close();

      expect(close).toHaveBeenCalledWith();
    });
  });
});
