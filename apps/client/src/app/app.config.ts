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

import {
  AuthService,
  authInterceptor,
} from '@steam-idler/client/auth/data-access';

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
      const authService = inject(AuthService);
      await configService.load();
      await firstValueFrom(authService.loadCurrentUser());
    }),
  ],
};
