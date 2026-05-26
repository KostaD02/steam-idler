import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ThemeService } from '@steam-idler/client/infra/core';

@Component({
  selector: 'si-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
