import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

@Component({
  selector: 'si-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  protected readonly dialogRef = inject(DialogRef, { optional: true });

  readonly closable = input(true);

  close(): void {
    this.dialogRef?.close();
  }
}
