import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { DialogComponent } from '@steam-idler/client/infra/ui/dialog';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';

export interface EditGamesDialogData {
  accountName: string;
  gameIds: number[];
}

@Component({
  selector: 'si-edit-games-dialog',
  templateUrl: './edit-games-dialog.component.html',
  styleUrl: './edit-games-dialog.component.scss',
  imports: [ReactiveFormsModule, DialogComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGamesDialogComponent {
  private readonly dialogRef = inject<DialogRef<number[]>>(DialogRef);

  protected readonly data = inject<EditGamesDialogData>(DIALOG_DATA);

  readonly ids = signal<number[]>([...this.data.gameIds]);
  readonly newId = new FormControl<number | null>(null);

  add(): void {
    const value = this.newId.value;

    if (value === null || !Number.isInteger(value) || value <= 0) {
      return;
    }

    if (!this.ids().includes(value)) {
      this.ids.update((ids) => [...ids, value]);
    }

    this.newId.reset();
  }

  removeId(id: number): void {
    this.ids.update((ids) => ids.filter((current) => current !== id));
  }

  save(): void {
    this.dialogRef.close(this.ids());
  }

  close(): void {
    this.dialogRef.close();
  }
}
