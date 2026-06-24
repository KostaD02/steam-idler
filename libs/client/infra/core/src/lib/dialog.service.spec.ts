import { Dialog } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { TestBed } from '@angular/core/testing';

import { DialogService } from './dialog.service';

const buildDialogStub = () => ({
  open: jest.fn().mockReturnValue({ id: 'ref' }),
  closeAll: jest.fn(),
  getDialogById: jest.fn().mockReturnValue({ id: 'by-id' }),
});

type DialogStub = ReturnType<typeof buildDialogStub>;

const DummyComponent = class {} as ComponentType<unknown>;

const setup = () => {
  const dialog = buildDialogStub();
  TestBed.configureTestingModule({
    providers: [{ provide: Dialog, useValue: dialog }],
  });
  const service = TestBed.inject(DialogService);

  return { service, dialog: dialog as DialogStub };
};

describe('DialogService', () => {
  describe('open', () => {
    it('opens the dialog and returns the ref', () => {
      const { service, dialog } = setup();

      const ref = service.open(DummyComponent);

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(ref).toEqual({ id: 'ref' });
    });

    it('merges the default config when none is supplied', () => {
      const { service, dialog } = setup();

      service.open(DummyComponent);

      const [, config] = dialog.open.mock.calls[0];
      expect(config).toMatchObject({
        hasBackdrop: true,
        disableClose: false,
        ariaModal: true,
        role: 'dialog',
        panelClass: 'si-dialog-panel',
        backdropClass: 'si-dialog-backdrop',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '100vh',
      });
    });

    it('lets the caller config override the defaults', () => {
      const { service, dialog } = setup();

      service.open(DummyComponent, { disableClose: true, maxWidth: '900px' });

      const [, config] = dialog.open.mock.calls[0];
      expect(config).toMatchObject({
        disableClose: true,
        maxWidth: '900px',
        hasBackdrop: true,
      });
    });
  });

  describe('closeAll', () => {
    it('delegates to the dialog service', () => {
      const { service, dialog } = setup();

      service.closeAll();

      expect(dialog.closeAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('returns the dialog ref looked up by id', () => {
      const { service, dialog } = setup();

      const ref = service.getById('abc');

      expect(dialog.getDialogById).toHaveBeenCalledWith('abc');
      expect(ref).toEqual({ id: 'by-id' });
    });
  });
});
