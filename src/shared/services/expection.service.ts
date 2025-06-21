import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLoggerService } from './logger.service';
import { StatusExceptionKeys } from '../types/expections';

@Injectable()
export class ExpectionService {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(ExpectionService.name);
  }

  throwException(
    expection: StatusExceptionKeys,
    message?: string,
    errorKeys?: string | string[],
    excludeFromLog = false,
  ): never {
    const isRateLimitExceeded = message === 'RateLimitExceeded';
    const status = this.getStatusCode(expection, isRateLimitExceeded);
    if (isRateLimitExceeded) {
      errorKeys = [StatusExceptionKeys.RateLimitExceeded];
    }
    if (!excludeFromLog) {
      this.logger.error(
        `Error: ${message} | Error Keys: ${JSON.stringify(errorKeys)}`,
      );
    }
    throw new HttpException(
      {
        status,
        error: message || '',
        message: Array.isArray(errorKeys) ? errorKeys : [errorKeys],
      },
      status,
    );
  }

  get statusKeys(): { status: number; key: StatusExceptionKeys }[] {
    return [
      {
        status: 400,
        key: StatusExceptionKeys.BadRequest,
      },
      {
        status: 401,
        key: StatusExceptionKeys.Unauthorized,
      },
      {
        status: 402,
        key: StatusExceptionKeys.PaymentRequired,
      },
      {
        status: 403,
        key: StatusExceptionKeys.Forbidden,
      },
      {
        status: 404,
        key: StatusExceptionKeys.NotFound,
      },
      {
        status: 409,
        key: StatusExceptionKeys.Conflict,
      },
      {
        status: 413,
        key: StatusExceptionKeys.ContentTooLarge,
      },
      {
        status: 415,
        key: StatusExceptionKeys.UnsupportedMediaType,
      },
      {
        status: 418,
        key: StatusExceptionKeys.Teapot,
      },
      {
        status: 420,
        key: StatusExceptionKeys.EnhanceYourCalm,
      },
    ];
  }

  private getStatusCode(
    key: StatusExceptionKeys,
    isRateLimitExceeded: boolean,
  ): number {
    if (isRateLimitExceeded) {
      return 429;
    }
    switch (key) {
      case StatusExceptionKeys.BadRequest:
        return HttpStatus.BAD_REQUEST;
      case StatusExceptionKeys.Unauthorized:
        return HttpStatus.UNAUTHORIZED;
      case StatusExceptionKeys.PaymentRequired:
        return HttpStatus.PAYMENT_REQUIRED;
      case StatusExceptionKeys.Forbidden:
        return HttpStatus.FORBIDDEN;
      case StatusExceptionKeys.NotFound:
        return HttpStatus.NOT_FOUND;
      case StatusExceptionKeys.Conflict:
        return HttpStatus.CONFLICT;
      case StatusExceptionKeys.ContentTooLarge:
        return HttpStatus.PAYLOAD_TOO_LARGE;
      case StatusExceptionKeys.UnsupportedMediaType:
        return HttpStatus.UNSUPPORTED_MEDIA_TYPE;
      case StatusExceptionKeys.Teapot:
        return HttpStatus.I_AM_A_TEAPOT;
      default:
        return 420;
    }
  }
}
