import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import {
  SteamIdlerEnvironmentEnum,
  SteamIdlerLogger,
} from '@steam-idler/infra';

export interface ConfigSchema {
  apiBase: string;
  logEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  // TODO: move logger to different service or injection token
  private readonly logger = new SteamIdlerLogger(
    SteamIdlerEnvironmentEnum.Clinet,
    ConfigService.name,
  );
  private readonly httpClient = inject(HttpClient);

  config: Readonly<ConfigSchema> | null = null;

  async load(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.httpClient.get<ConfigSchema>('/config.json'),
      );
      this.config = config;
      Object.freeze(this.config);
      this.logger.log('Config loaded', this.config);
    } catch {
      this.logger.error('Failed to load config');
    }
  }
}
