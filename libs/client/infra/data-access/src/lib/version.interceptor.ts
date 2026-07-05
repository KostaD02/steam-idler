import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_CONFIG } from '@steam-idler/infra';

import { ConfigService } from './config.service';

export const versionInterceptor: HttpInterceptorFn = (req, next) => {
  const version = inject(ConfigService).config?.version;

  if (!version) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { [API_CONFIG.CLIENT_VERSION_HEADER]: version },
    }),
  );
};
