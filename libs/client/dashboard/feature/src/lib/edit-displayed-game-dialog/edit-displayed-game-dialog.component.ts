import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogComponent } from '@steam-idler/client/infra/ui/dialog';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';
import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';

export interface EditDisplayedGameDialogData {
  accountName: string;
  displayedGameName: string;
}

@Component({
  selector: 'si-edit-displayed-game-dialog',
  templateUrl: './edit-displayed-game-dialog.component.html',
  styleUrl: './edit-displayed-game-dialog.component.scss',
  imports: [ReactiveFormsModule, DialogComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDisplayedGameDialogComponent {
  private readonly dialogRef = inject<DialogRef<string>>(DialogRef);

  protected readonly data = inject<EditDisplayedGameDialogData>(DIALOG_DATA);

  readonly maxLength = STEAM_ACCOUNT_API_CONFIG.MAX_DISPLAYED_GAME_NAME_LENGTH;

  readonly displayedGameName = new FormControl<string>(
    this.data.displayedGameName,
    {
      nonNullable: true,
      validators: [Validators.maxLength(this.maxLength)],
    },
  );

  save(): void {
    if (this.displayedGameName.invalid) {
      return;
    }

    this.dialogRef.close(this.displayedGameName.value);
  }

  close(): void {
    this.dialogRef.close();
  }
}
