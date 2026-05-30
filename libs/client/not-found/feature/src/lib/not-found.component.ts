import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
