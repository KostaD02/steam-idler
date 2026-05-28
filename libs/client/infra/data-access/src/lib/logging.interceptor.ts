import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { tap } from 'rxjs';

import {
  API_CONFIG,
  API_SENSITIVE_KEYS,
  generateUuid,
  getISOString,
  SafeAny,
  sanitizeObject,
} from '@steam-idler/infra';

import { LoggerService } from '@steam-idler/client/infra/util';

const NAMESPACE = 'HttpClient';

const collectQuery = (
  req: HttpRequest<unknown>,
): Record<string, SafeAny> | null => {
  const keys = req.params.keys();
  if (!keys.length) return null;
  return keys.reduce<Record<string, SafeAny>>((acc, key) => {
    const all = req.params.getAll(key) ?? [];
    acc[key] = all.length > 1 ? all : req.params.get(key);
    return acc;
  }, {});
};

const sanitizeBody = (body: unknown): SafeAny => {
  if (body && typeof body === 'object') {
    return sanitizeObject(body as Record<string, SafeAny>, API_SENSITIVE_KEYS);
  }
  return body ?? null;
};

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  const requestId =
    req.headers.get(API_CONFIG.REQUEST_ID_HEADER) ?? generateUuid();

  const tracedReq = req.headers.has(API_CONFIG.REQUEST_ID_HEADER)
    ? req
    : req.clone({ setHeaders: { [API_CONFIG.REQUEST_ID_HEADER]: requestId } });

  const startTime = Date.now();

  const buildEntry = (statusCode: number, response: unknown) => ({
    endpoint: tracedReq.urlWithParams,
    query: collectQuery(tracedReq),
    method: tracedReq.method,
    statusCode,
    timestamp: getISOString(),
    durationMs: Date.now() - startTime,
    requestId,
    body: sanitizeBody(tracedReq.body),
    response: sanitizeBody(response),
  });

  return next(tracedReq).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          logger.log(NAMESPACE, buildEntry(event.status, event.body));
        }
      },
      error: (err: HttpErrorResponse) => {
        const status = err.status || 0;
        const entry = buildEntry(status, err.error);
        if (status >= 500 || status === 0) {
          logger.error(NAMESPACE, entry);
        } else {
          logger.warn(NAMESPACE, entry);
        }
      },
    }),
  );
};
