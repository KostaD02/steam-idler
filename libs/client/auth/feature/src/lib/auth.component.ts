import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';

@Component({
  selector: 'si-auth',
  imports: [RouterOutlet],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly layoutService = inject(LayoutService);

  readonly sizing = this.layoutService.sizing;
}
