import { HttpException, Injectable } from '@nestjs/common';

import {
  ExceptionStatusCodesKeys,
  ExceptionStatusKey,
  ExceptionStatusKeys,
  HttpExceptionResponse,
} from '@steam-idler/server/infra/types';

@Injectable()
export class ExceptionService {
  throw(
    exception: ExceptionStatusKey = ExceptionStatusKeys.InternalServerError,
    message?: string,
    errorKeys?: string[],
  ): never {
    const status = ExceptionStatusCodesKeys[exception];
    const body: HttpExceptionResponse = {
      status,
      message,
      errorKeys,
      error: exception,
    };
    throw new HttpException(body, status);
  }
}
