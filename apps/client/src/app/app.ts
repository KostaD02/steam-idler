import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { HeaderComponent } from '@steam-idler/client/header/ui';

@Component({
  imports: [RouterModule, HeaderComponent],
  selector: 'si-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);

  readonly sizing = this.layoutService.sizing;
}
