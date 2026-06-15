import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogComponent } from '@steam-idler/client/infra/ui/dialog';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';
import { STEAM_ACCOUNT_API_CONFIG } from '@steam-idler/server/steam-account/core';
import { UpdateAutoReplyDto } from '@steam-idler/server/steam-account/types';

export interface EditAutoReplyDialogData {
  accountName: string;
  template: string;
  whileIdling: boolean;
}

@Component({
  selector: 'si-edit-auto-reply-dialog',
  templateUrl: './edit-auto-reply-dialog.component.html',
  styleUrl: './edit-auto-reply-dialog.component.scss',
  imports: [ReactiveFormsModule, DialogComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAutoReplyDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject<DialogRef<UpdateAutoReplyDto>>(DialogRef);

  protected readonly data = inject<EditAutoReplyDialogData>(DIALOG_DATA);

  readonly maxLength = STEAM_ACCOUNT_API_CONFIG.MAX_AUTO_REPLY_TEMPLATE_LENGTH;

  readonly form = this.fb.nonNullable.group({
    template: this.fb.nonNullable.control(this.data.template, [
      Validators.maxLength(this.maxLength),
    ]),
    whileIdling: this.fb.nonNullable.control(this.data.whileIdling),
  });

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  close(): void {
    this.dialogRef.close();
  }
}
