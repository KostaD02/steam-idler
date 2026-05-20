import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { LoggerService } from '@steam-idler/client/infra/util';

export interface ConfigSchema {
  apiBase: string;
  logEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly httpClient = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  config: Readonly<ConfigSchema> | null = null;

  async load(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.httpClient.get<ConfigSchema>('/config.json'),
      );
      this.config = config;
      Object.freeze(this.config);
      this.logger.log(ConfigService.name, 'Config loaded', this.config);
    } catch {
      this.logger.error(ConfigService.name, 'Failed to load config');
    }
  }
}
