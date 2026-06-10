import { DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { DialogService } from '@steam-idler/client/infra/core';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialogService = inject(DialogService);

  confirm(
    data: ConfirmDialogData,
    config?: DialogConfig<ConfirmDialogData, DialogRef<boolean>>,
  ): Observable<boolean> {
    return this.dialogService
      .open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
        ...config,
        data,
      })
      .closed.pipe(map((result) => result === true));
  }
}
