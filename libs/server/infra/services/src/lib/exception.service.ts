import { HttpException, Injectable } from '@nestjs/common';

import { type HttpExceptionResponse } from '@steam-idler/infra';

import {
  ExceptionStatusCodesKeys,
  ExceptionStatusKey,
  ExceptionStatusKeys,
} from '@steam-idler/server/infra/types';

@Injectable()
export class ExceptionService {
  throw(
    exception: ExceptionStatusKey = ExceptionStatusKeys.InternalServerError,
    message: string,
    errorKeys: string[],
  ): never {
    const status =
      ExceptionStatusCodesKeys[exception] ||
      ExceptionStatusCodesKeys[ExceptionStatusKeys.EnhanceYourCalm];
    const body: HttpExceptionResponse = {
      status,
      message,
      errorKeys,
      error: exception,
    };
    throw new HttpException(body, status);
  }
}
