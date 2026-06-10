import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';
import { ConfirmDialogService } from '@steam-idler/client/infra/ui/dialog';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [TranslatePipe, CardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly user = this.authService.user;
  readonly sizing = this.layoutService.sizing;

  readonly lastResult = signal<boolean | null>(null);

  openConfirmDemo(): void {
    this.confirmDialog
      .confirm({
        title: 'Confirm dialog demo',
        body: 'This is the reusable confirm dialog. Press OK or Close.',
      })
      .subscribe((confirmed) => this.lastResult.set(confirmed));
  }
}
