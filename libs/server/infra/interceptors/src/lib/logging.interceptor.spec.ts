import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { firstValueFrom, of, throwError } from 'rxjs';

import { LogLevel, LogLevelEnum } from '@steam-idler/infra';

import { LoggingInterceptor } from './logging.interceptor';
import { SKIP_LOGGING } from './skip-logging.decorator';

const buildRequest = (overrides: Record<string, unknown> = {}) => ({
  originalUrl: '/accounts',
  method: 'GET',
  params: {},
  query: {},
  headers: {},
  body: null,
  ...overrides,
});

const buildContext = (
  req: Record<string, unknown>,
  statusCode = 200,
): ExecutionContext =>
  ({
    getHandler: jest.fn().mockReturnValue(() => undefined),
    getClass: jest.fn().mockReturnValue(class {}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(req),
      getResponse: jest.fn().mockReturnValue({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

const setup = (skipLogging = false, logLevel: LogLevel = LogLevelEnum.All) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(skipLogging),
  } as unknown as Reflector;

  const interceptor = new LoggingInterceptor(reflector, logLevel);

  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();

  return { interceptor, reflector, log, warn, error };
};

describe('LoggingInterceptor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bypasses logging when the skip marker is present', async () => {
    const { interceptor, log, warn, error } = setup(true);
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('body')) };
    const context = buildContext(buildRequest());

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('body');
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('reads the marker from both the handler and the class', async () => {
    const { interceptor, reflector } = setup(true);
    const context = buildContext(buildRequest());
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('body')) };

    await firstValueFrom(interceptor.intercept(context, next));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_LOGGING, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('logs successful responses at log level', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('ok')) };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
    expect(log).toHaveBeenCalledTimes(1);

    const payload = log.mock.calls[0][0] as Record<string, unknown>;

    expect(payload['endpoint']).toBe('/accounts');
    expect(payload['statusCode']).toBe(200);
    expect(payload['method']).toBe('GET');
  });

  it('logs 4xx responses as warnings', async () => {
    const { interceptor, warn } = setup();
    const context = buildContext(buildRequest(), 404);
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('nope')) };

    await firstValueFrom(interceptor.intercept(context, next));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(
      (warn.mock.calls[0][0] as Record<string, unknown>)['statusCode'],
    ).toBe(404);
  });

  it('logs thrown errors at error level and rethrows', async () => {
    const { interceptor, error } = setup();
    const context = buildContext(buildRequest(), 200);
    const failure = { status: 503, message: 'down' };
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => failure)),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(failure);

    expect(error).toHaveBeenCalledTimes(1);
    expect(
      (error.mock.calls[0][0] as Record<string, unknown>)['statusCode'],
    ).toBe(503);
  });

  it('falls back to status 500 when the error carries no status', async () => {
    const { interceptor, error } = setup();
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => new Error('boom'))),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow('boom');

    expect(
      (error.mock.calls[0][0] as Record<string, unknown>)['statusCode'],
    ).toBe(500);
  });

  it('skips non-error logging when the log level is below All', async () => {
    const { interceptor, log, warn, error } = setup(
      false,
      LogLevelEnum.ErrorOnly,
    );
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('ok')) };

    await firstValueFrom(interceptor.intercept(context, next));

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('still logs 5xx errors when the log level is ErrorOnly', async () => {
    const { interceptor, error } = setup(false, LogLevelEnum.ErrorOnly);
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBeDefined();

    expect(error).toHaveBeenCalledTimes(1);
  });

  it('sanitizes sensitive body fields before logging', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(
      buildRequest({ method: 'POST', body: { password: 'secret', name: 'a' } }),
      200,
    );
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('ok')) };

    await firstValueFrom(interceptor.intercept(context, next));

    const payload = log.mock.calls[0][0] as { body: Record<string, unknown> };

    expect(payload.body['password']).toBe('[SANITIZED]');
    expect(payload.body['name']).toBe('a');
  });

  it('extracts the user id and preserves request id and params', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(
      buildRequest({
        params: { id: '7' },
        query: { page: '1' },
        headers: { 'x-request-id': 'req-1' },
        user: { _id: 99 },
      }),
      200,
    );
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('ok')) };

    await firstValueFrom(interceptor.intercept(context, next));

    const payload = log.mock.calls[0][0] as Record<string, unknown>;

    expect(payload['userId']).toBe('99');
    expect(payload['requestId']).toBe('req-1');
    expect(payload['params']).toEqual({ id: '7' });
    expect(payload['query']).toEqual({ page: '1' });
  });

  it('nulls params and query when they are empty', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('ok')) };

    await firstValueFrom(interceptor.intercept(context, next));

    const payload = log.mock.calls[0][0] as Record<string, unknown>;

    expect(payload['params']).toBeNull();
    expect(payload['query']).toBeNull();
    expect(payload['userId']).toBeNull();
  });

  it('generates a request id when the header is absent', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = { handle: jest.fn().mockReturnValue(of('ok')) };

    await firstValueFrom(interceptor.intercept(context, next));

    const payload = log.mock.calls[0][0] as { requestId: string };

    expect(payload.requestId).toMatch(/[0-9a-f-]{36}/);
  });

  it('serializes mongoose-style responses via toObject', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(buildRequest(), 200);
    const response = { toObject: () => ({ name: 'doc', token: 'x' }) };
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(of(response)),
    };

    await firstValueFrom(interceptor.intercept(context, next));

    const payload = log.mock.calls[0][0] as {
      response: Record<string, unknown>;
    };

    expect(payload.response).toEqual({ name: 'doc', token: 'x' });
  });

  it('trims the status field from HttpException responses', async () => {
    const { interceptor, error } = setup();
    const context = buildContext(buildRequest(), 200);
    const exception = {
      status: 500,
      name: 'HttpException',
      response: { message: 'failed', status: 500 },
    };
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => exception)),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(exception);

    const payload = error.mock.calls[0][0] as {
      response: Record<string, unknown>;
    };

    expect(payload.response).toEqual({ message: 'failed' });
    expect(payload.response['status']).toBeUndefined();
  });

  it('logs null when the response is empty', async () => {
    const { interceptor, log } = setup();
    const context = buildContext(buildRequest(), 200);
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(of(null)),
    };

    await firstValueFrom(interceptor.intercept(context, next));

    expect((log.mock.calls[0][0] as { response: unknown }).response).toBeNull();
  });

  it('propagates a thrown HttpException to the caller', async () => {
    const { interceptor } = setup();
    const context = buildContext(buildRequest(), 200);
    const exception = new HttpException('forbidden', 403);
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => exception)),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow(HttpException);
  });
});
