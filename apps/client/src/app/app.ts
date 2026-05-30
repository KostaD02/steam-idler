import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { LayoutService, LoaderService } from '@steam-idler/client/infra/core';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { HeaderComponent } from '@steam-idler/client/header/ui';

@Component({
  imports: [RouterModule, HeaderComponent],
  selector: 'si-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly loaderService = inject(LoaderService);

  readonly sizing = this.layoutService.sizing;
  readonly loading = this.loaderService.isVisible;

  async ngOnInit(): Promise<void> {
    await firstValueFrom(this.authService.loadCurrentUser());
  }
}
