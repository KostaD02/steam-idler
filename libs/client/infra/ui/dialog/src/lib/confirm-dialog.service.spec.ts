import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { DialogService } from '@steam-idler/client/infra/core';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  const open = jest.fn();
  let service: ConfirmDialogService;

  const data: ConfirmDialogData = { title: 'Remove account', body: 'Sure?' };

  beforeEach(() => {
    open.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: DialogService, useValue: { open } }],
    });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('opens the confirm dialog with the provided data', () => {
    open.mockReturnValue({ closed: of(true) });

    service.confirm(data).subscribe();

    expect(open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.objectContaining({ data }),
    );
  });

  it('emits true when the dialog is confirmed', () => {
    open.mockReturnValue({ closed: of(true) });

    let result: boolean | undefined;
    service.confirm(data).subscribe((value) => (result = value));

    expect(result).toBe(true);
  });

  it('emits false when the dialog is dismissed', () => {
    open.mockReturnValue({ closed: of(undefined) });

    let result: boolean | undefined;
    service.confirm(data).subscribe((value) => (result = value));

    expect(result).toBe(false);
  });
});
