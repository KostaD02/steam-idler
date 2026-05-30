import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import {
  ConfigService,
  loggingInterceptor,
} from '@steam-idler/client/infra/data-access';

import { authInterceptor } from '@steam-idler/client/auth/data-access';
import { I18nService } from '@steam-idler/client/i18n/data-access';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(
      withFetch(),
      withInterceptors([loggingInterceptor, authInterceptor]),
    ),
    provideAppInitializer(async () => {
      const configService = inject(ConfigService);
      const i18nService = inject(I18nService);
      await configService.load();
      i18nService.init(configService.config?.version);
    }),
  ],
};
