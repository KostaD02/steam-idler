import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { firstValueFrom } from 'rxjs';

export interface AppConfigSchema {
  apiBase: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfig {
  // TODO: move to separated lib
  private readonly http = inject(HttpClient);
  private config!: AppConfigSchema;

  async load(): Promise<void> {
    this.config = await firstValueFrom(
      this.http.get<AppConfigSchema>('/config.json'),
    );
  }

  get apiBase(): string {
    return this.config.apiBase;
  }
}
