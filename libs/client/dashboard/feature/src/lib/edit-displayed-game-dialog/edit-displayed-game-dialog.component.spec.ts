import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';

import {
  EditDisplayedGameDialogComponent,
  EditDisplayedGameDialogData,
} from './edit-displayed-game-dialog.component';

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const setup = async (data: EditDisplayedGameDialogData) => {
  const close = jest.fn();

  await TestBed.configureTestingModule({
    imports: [EditDisplayedGameDialogComponent],
    providers: [
      { provide: DialogRef, useValue: { close } },
      { provide: DIALOG_DATA, useValue: data },
      { provide: I18nService, useValue: buildI18nStub() },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<EditDisplayedGameDialogComponent> =
    TestBed.createComponent(EditDisplayedGameDialogComponent);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, close };
};

describe('EditDisplayedGameDialogComponent', () => {
  it('seeds the control from the dialog data', async () => {
    const { component } = await setup({
      accountName: 'bob',
      displayedGameName: 'My Game',
    });

    expect(component.displayedGameName.value).toBe('My Game');
  });

  describe('save', () => {
    it('closes the dialog with the current value', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        displayedGameName: 'My Game',
      });
      component.displayedGameName.setValue('New Game');

      component.save();

      expect(close).toHaveBeenCalledWith('New Game');
    });

    it('does not close when the value exceeds the max length', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        displayedGameName: 'My Game',
      });
      component.displayedGameName.setValue('x'.repeat(component.maxLength + 1));

      component.save();

      expect(close).not.toHaveBeenCalled();
    });

    it('closes with an empty string when cleared', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        displayedGameName: 'My Game',
      });
      component.displayedGameName.setValue('');

      component.save();

      expect(close).toHaveBeenCalledWith('');
    });
  });

  describe('close', () => {
    it('closes the dialog without a value', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        displayedGameName: 'My Game',
      });

      component.close();

      expect(close).toHaveBeenCalledWith();
    });
  });
});
