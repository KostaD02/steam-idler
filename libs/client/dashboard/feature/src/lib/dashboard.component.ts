import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
