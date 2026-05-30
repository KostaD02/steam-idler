import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { LayoutService } from '@steam-idler/client/infra/core';
import { ConfigService } from '@steam-idler/client/infra/data-access';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-api',
  templateUrl: './api.component.html',
  styleUrl: './api.component.scss',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiComponent {
  private readonly domSanitizer = inject(DomSanitizer);
  private readonly layoutService = inject(LayoutService);
  private readonly configService = inject(ConfigService);

  private readonly apiBase = this.configService.config?.apiBase;

  readonly sizing = this.layoutService.sizing;

  readonly swaggerUrl = this.apiBase
    ? this.domSanitizer.bypassSecurityTrustResourceUrl(
        `${this.apiBase}/swagger`,
      )
    : null;
}
