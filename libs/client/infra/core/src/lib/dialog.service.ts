import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  private readonly defaultConfig: Pick<
    DialogConfig,
    | 'hasBackdrop'
    | 'disableClose'
    | 'ariaModal'
    | 'role'
    | 'panelClass'
    | 'backdropClass'
    | 'width'
    | 'maxWidth'
    | 'maxHeight'
  > = {
    hasBackdrop: true,
    disableClose: false,
    ariaModal: true,
    role: 'dialog',
    panelClass: 'si-dialog-panel',
    backdropClass: 'si-dialog-backdrop',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '100vh',
  };

  open<R = unknown, D = unknown, C = unknown>(
    componentOrTemplate: ComponentType<C> | TemplateRef<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(componentOrTemplate, {
      ...this.defaultConfig,
      ...config,
    });
  }

  closeAll(): void {
    this.dialog.closeAll();
  }

  getById<R = unknown, C = unknown>(id: string): DialogRef<R, C> | undefined {
    return this.dialog.getDialogById<R, C>(id);
  }
}
