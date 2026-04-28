import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { getISOString } from '@steam-idler/infra';

import {
  HttpExceptionResponse,
  ExceptionStatusKeys,
  CommonExpectionsKeys,
} from '@steam-idler/server/infra/types';

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const logger = new Logger(HttpExceptionsFilter.name);
    const expections = [
      'HttpException',
      'NotFoundException',
      'BadRequestException',
      'UnauthorizedException',
      'ThrottlerException',
    ];
    const isHttpException = expections.includes(exception.name);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = isHttpException
      ? (exception as HttpException)?.getStatus()
      : 500;

    const exceptionResponse: HttpExceptionResponse = {
      error: exception.message,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ExceptionStatusKeys.InternalServerError,
      errorKeys: [ExceptionStatusKeys.InternalServerError],
    };

    if (isHttpException && exception.name === 'NotFoundException') {
      // 404 errors
      exceptionResponse.status = status;
      exceptionResponse.error = ExceptionStatusKeys.NotFound;
      exceptionResponse.message = 'This endpoint does not exist!';
      exceptionResponse.errorKeys = [ExceptionStatusKeys.NotFound];
    } else if (isHttpException) {
      const data = (
        exception as HttpException
      ).getResponse() as HttpExceptionResponse;
      const errorWithIncorrectStructure = Array.isArray(data.message);
      exceptionResponse.status = status;
      if (errorWithIncorrectStructure) {
        if (data.message[0].includes('should not exist')) {
          // Property whitelist errors
          exceptionResponse.error = ExceptionStatusKeys.BadRequest;
          exceptionResponse.message = data.message[0];
          exceptionResponse.errorKeys = [
            CommonExpectionsKeys.PropertyShouldNotExist,
          ];
        } else {
          // Validation errors
          exceptionResponse.message = data.error;
          exceptionResponse.error = data.message[0];
          exceptionResponse.errorKeys = data.message as string[];
        }
      } else {
        // Custom HttpExceptions
        exceptionResponse.error = data.error;
        exceptionResponse.message = data.message;
        exceptionResponse.errorKeys = data.errorKeys;
      }
      if (!Array.isArray(exceptionResponse.errorKeys)) {
        exceptionResponse.errorKeys = [exceptionResponse.errorKeys];
      }
      if (!exceptionResponse.errorKeys.includes(exceptionResponse.error)) {
        exceptionResponse.errorKeys.unshift(exceptionResponse.error);
      }
    } else {
      // Not anticipated exceptions
      exceptionResponse.error = 'Internal Server Error';
      exceptionResponse.status = HttpStatus.INTERNAL_SERVER_ERROR;
      exceptionResponse.message = ExceptionStatusKeys.InternalServerError;
      exceptionResponse.errorKeys = [ExceptionStatusKeys.InternalServerError];
      logger.error(exception.message);
    }

    if (exceptionResponse?.message?.includes('JSON at')) {
      exceptionResponse.message = 'Invalid JSON payload';
      exceptionResponse.error = CommonExpectionsKeys.InvalidJSON;
      exceptionResponse.errorKeys = [CommonExpectionsKeys.InvalidJSON];
    }

    response.status(status).json({
      path: request.url,
      statusCode: status,
      message: exceptionResponse.message,
      error: exceptionResponse.error,
      errorKeys: exceptionResponse.errorKeys,
      timestamp: getISOString(),
      swagger: `${request.protocol}://${request.get('host')}/api/swagger`,
    });
  }
}
