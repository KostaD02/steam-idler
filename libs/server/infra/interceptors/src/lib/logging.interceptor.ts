import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

import {
  API_CONFIG,
  API_SENSITIVE_KEYS,
  generateUuid,
  getISOString,
  SafeAny,
  sanitizeObject,
} from '@steam-idler/infra';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<SafeAny> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        this.log(req, res.statusCode, Date.now() - startTime, response);
      }),
      catchError((error) => {
        this.log(req, error?.status || 500, Date.now() - startTime, error);
        return throwError(() => error);
      }),
    );
  }

  private log(
    req: Request,
    statusCode: number,
    durationMs: number,
    res: SafeAny,
  ): void {
    const userId = (req as SafeAny).user?._id;
    const params =
      req.params && Object.keys(req.params).length ? { ...req.params } : null;

    const query =
      req.query && Object.keys(req.query).length ? { ...req.query } : null;

    const data = {
      endpoint: req.originalUrl,
      params,
      query,
      method: req.method,
      statusCode,
      timestamp: getISOString(),
      durationMs,
      userId: userId ? String(userId) : null,
      requestId: req.headers[API_CONFIG.REQUEST_ID_HEADER] || generateUuid(),
      body: req.body ? sanitizeObject(req.body, API_SENSITIVE_KEYS) : null,
      response: this.formatResponse(res?.toObject ? res.toObject() : res),
    };

    if (statusCode >= 500) {
      this.logger.error(data);
    } else if (statusCode >= 400) {
      this.logger.warn(data);
    } else {
      this.logger.log(data);
    }
  }

  private formatResponse(res: SafeAny) {
    const result = sanitizeObject(res, API_SENSITIVE_KEYS) ?? null;

    if (!result) {
      return null;
    }

    if (result['response'] && result['name'] === 'HttpException') {
      const shorterResponse = {
        ...result['response'],
      };
      delete shorterResponse['status'];
      return shorterResponse;
    }

    return result;
  }
}
