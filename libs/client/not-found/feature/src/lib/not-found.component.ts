import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';
import { CardComponent } from '@steam-idler/client/infra/ui/card';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  imports: [RouterLink, TranslatePipe, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly layoutService = inject(LayoutService);

  readonly sizing = this.layoutService.sizing;
}
