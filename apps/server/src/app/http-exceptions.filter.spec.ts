import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  CommonExpectionsKeys,
  ExceptionStatusKeys,
} from '@steam-idler/server/infra/types';

import { HttpExceptionsFilter } from './http-exceptions.filter';

const buildHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = {
    url: '/api/things',
    protocol: 'https',
    get: jest.fn().mockReturnValue('example.com'),
  };
  const host = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(response),
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json, request };
};

const setup = () => {
  const filter = new HttpExceptionsFilter();
  const { host, status, json, request } = buildHost();

  return { filter, host, status, json, request };
};

describe('HttpExceptionsFilter', () => {
  describe('not found exceptions', () => {
    it('responds with the endpoint-does-not-exist payload', () => {
      const { filter, host, status, json } = setup();
      const exception = new NotFoundException();

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'This endpoint does not exist!',
          error: ExceptionStatusKeys.NotFound,
          errorKeys: [ExceptionStatusKeys.NotFound],
        }),
      );
    });
  });

  describe('custom http exceptions', () => {
    it('maps a structured error response and prepends the error to the keys', () => {
      const { filter, host, status, json } = setup();
      const exception = new HttpException(
        {
          error: ExceptionStatusKeys.Forbidden,
          message: 'You may not do that',
          errorKeys: ['errors.specific'],
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);

      const payload = json.mock.calls[0][0];

      expect(payload.error).toBe(ExceptionStatusKeys.Forbidden);
      expect(payload.message).toBe('You may not do that');
      expect(payload.errorKeys).toEqual([
        ExceptionStatusKeys.Forbidden,
        'errors.specific',
      ]);
    });

    it('wraps a non-array errorKeys value into an array', () => {
      const { filter, host, json } = setup();
      const exception = new HttpException(
        {
          error: ExceptionStatusKeys.Conflict,
          message: 'Already exists',
          errorKeys: 'errors.single',
        },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, host);

      const payload = json.mock.calls[0][0];

      expect(payload.errorKeys).toEqual([
        ExceptionStatusKeys.Conflict,
        'errors.single',
      ]);
    });

    it('does not duplicate the error when it is already in the keys', () => {
      const { filter, host, json } = setup();
      const exception = new HttpException(
        {
          error: ExceptionStatusKeys.BadRequest,
          message: 'Bad',
          errorKeys: [ExceptionStatusKeys.BadRequest],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      const payload = json.mock.calls[0][0];

      expect(payload.errorKeys).toEqual([ExceptionStatusKeys.BadRequest]);
    });
  });

  describe('validation exceptions', () => {
    it('treats whitelist violations as property-should-not-exist', () => {
      const { filter, host, json } = setup();
      const exception = new HttpException(
        {
          error: 'Bad Request',
          message: ['property foo should not exist'],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      const payload = json.mock.calls[0][0];

      expect(payload.error).toBe(ExceptionStatusKeys.BadRequest);
      expect(payload.message).toBe('property foo should not exist');
      expect(payload.errorKeys).toContain(
        CommonExpectionsKeys.PropertyShouldNotExist,
      );
    });

    it('maps generic validation errors from the message array', () => {
      const { filter, host, json } = setup();
      const exception = new HttpException(
        {
          error: 'Bad Request',
          message: ['email must be an email', 'password too short'],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      const payload = json.mock.calls[0][0];

      expect(payload.message).toBe('Bad Request');
      expect(payload.error).toBe('email must be an email');
      expect(payload.errorKeys).toEqual([
        'email must be an email',
        'password too short',
      ]);
    });
  });

  describe('unanticipated exceptions', () => {
    it('responds with a 500 payload and logs the message', () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const { filter, host, status, json } = setup();
      const exception = new Error('boom');

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          error: 'Internal Server Error',
          message: ExceptionStatusKeys.InternalServerError,
          errorKeys: [ExceptionStatusKeys.InternalServerError],
        }),
      );
      expect(errorSpy).toHaveBeenCalledWith('boom');

      errorSpy.mockRestore();
    });
  });

  describe('invalid json payloads', () => {
    it('rewrites errors mentioning JSON parsing failures', () => {
      const { filter, host, json } = setup();
      const exception = new HttpException(
        {
          error: ExceptionStatusKeys.BadRequest,
          message: 'Unexpected token in JSON at position 4',
          errorKeys: [ExceptionStatusKeys.BadRequest],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      const payload = json.mock.calls[0][0];

      expect(payload.message).toBe('Invalid JSON payload');
      expect(payload.error).toBe(CommonExpectionsKeys.InvalidJSON);
      expect(payload.errorKeys).toEqual([CommonExpectionsKeys.InvalidJSON]);
    });
  });

  describe('response envelope', () => {
    it('includes the request path and swagger url', () => {
      const { filter, host, json, request } = setup();
      const exception = new NotFoundException();

      filter.catch(exception, host);

      const payload = json.mock.calls[0][0];

      expect(payload.path).toBe('/api/things');
      expect(payload.swagger).toBe('https://example.com/api/swagger');
      expect(payload.timestamp).toEqual(expect.any(String));
      expect(request.get).toHaveBeenCalledWith('host');
    });
  });
});
