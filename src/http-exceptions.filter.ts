import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const expectionResposne = exception.getResponse() as {
      error: string;
      statusCode: number;
      message: string | string[];
    };

    let isWrongEndpoint = false;

    if (expectionResposne.message instanceof String) {
      isWrongEndpoint = expectionResposne.message.startsWith('Cannot ');
    }

    response.status(status).json({
      path: request.url,
      statusCode: status,
      error: expectionResposne.error,
      errorKeys: isWrongEndpoint
        ? 'error.wrong_endpoint'
        : expectionResposne.message,
      timestamp: new Date().toISOString(),
      help: 'if you think this error should not happen, please create new issue at: https://github.com/kostad02/steam-idler/issues',
    });
  }
}
