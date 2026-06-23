import { HttpException, HttpStatus } from '@nestjs/common';

import { type HttpExceptionResponse } from '@steam-idler/infra';

import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { ExceptionService } from './exception.service';

const setup = () => {
  const service = new ExceptionService();

  return { service };
};

const captureBody = (fn: () => never): HttpExceptionResponse => {
  try {
    fn();
  } catch (error) {
    return (error as HttpException).getResponse() as HttpExceptionResponse;
  }

  throw new Error('expected throw to raise an exception');
};

describe('ExceptionService', () => {
  describe('throw', () => {
    it('throws an HttpException', () => {
      const { service } = setup();

      expect(() =>
        service.throw(ExceptionStatusKeys.NotFound, 'missing', ['errors.x']),
      ).toThrow(HttpException);
    });

    it('maps the exception key to its matching status code', () => {
      const { service } = setup();

      const body = captureBody(() =>
        service.throw(ExceptionStatusKeys.NotFound, 'missing', ['errors.x']),
      );

      expect(body.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('sets the HttpException status to the resolved code', () => {
      const { service } = setup();

      try {
        service.throw(ExceptionStatusKeys.Forbidden, 'denied', ['errors.x']);
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });

    it('builds a response body carrying the message, keys, and error', () => {
      const { service } = setup();

      const body = captureBody(() =>
        service.throw(ExceptionStatusKeys.BadRequest, 'bad input', [
          'errors.a',
          'errors.b',
        ]),
      );

      expect(body).toEqual({
        status: HttpStatus.BAD_REQUEST,
        message: 'bad input',
        errorKeys: ['errors.a', 'errors.b'],
        error: ExceptionStatusKeys.BadRequest,
      });
    });

    it('defaults to an internal server error when no exception key is given', () => {
      const { service } = setup();

      const body = captureBody(() =>
        service.throw(undefined as never, 'boom', ['errors.x']),
      );

      expect(body.error).toBe(ExceptionStatusKeys.InternalServerError);
      expect(body.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('falls back to enhance-your-calm for an unknown exception key', () => {
      const { service } = setup();

      const body = captureBody(() =>
        service.throw('errors.unknown' as never, 'mystery', ['errors.x']),
      );

      expect(body.status).toBe(420);
    });

    it('passes an empty error keys list through to the body', () => {
      const { service } = setup();

      const body = captureBody(() =>
        service.throw(ExceptionStatusKeys.Conflict, 'duplicate', []),
      );

      expect(body.errorKeys).toEqual([]);
    });
  });
});
