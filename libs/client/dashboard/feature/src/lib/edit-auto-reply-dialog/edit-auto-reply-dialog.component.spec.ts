import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';

import {
  EditAutoReplyDialogComponent,
  EditAutoReplyDialogData,
} from './edit-auto-reply-dialog.component';

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const setup = async (data: EditAutoReplyDialogData) => {
  const close = jest.fn();

  await TestBed.configureTestingModule({
    imports: [EditAutoReplyDialogComponent],
    providers: [
      { provide: DialogRef, useValue: { close } },
      { provide: DIALOG_DATA, useValue: data },
      { provide: I18nService, useValue: buildI18nStub() },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<EditAutoReplyDialogComponent> =
    TestBed.createComponent(EditAutoReplyDialogComponent);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, close };
};

describe('EditAutoReplyDialogComponent', () => {
  it('seeds the form from the dialog data', async () => {
    const { component } = await setup({
      accountName: 'bob',
      template: 'Hi there',
      whileIdling: true,
    });

    expect(component.form.getRawValue()).toEqual({
      template: 'Hi there',
      whileIdling: true,
    });
  });

  describe('save', () => {
    it('closes the dialog with the raw form value', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        template: 'Hi there',
        whileIdling: false,
      });
      component.form.controls.template.setValue('Updated');
      component.form.controls.whileIdling.setValue(true);

      component.save();

      expect(close).toHaveBeenCalledWith({
        template: 'Updated',
        whileIdling: true,
      });
    });

    it('does not close when the template exceeds the max length', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        template: 'Hi there',
        whileIdling: false,
      });
      component.form.controls.template.setValue(
        'x'.repeat(component.maxLength + 1),
      );

      component.save();

      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('closes the dialog without a value', async () => {
      const { component, close } = await setup({
        accountName: 'bob',
        template: 'Hi there',
        whileIdling: false,
      });

      component.close();

      expect(close).toHaveBeenCalledWith();
    });
  });
});
