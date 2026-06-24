import {
  HttpClient,
  HttpParams,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@steam-idler/infra';

import { LoggerService } from '@steam-idler/client/infra/util';

import { loggingInterceptor } from './logging.interceptor';

const TARGET_URL = '/resource';
const REQUEST_ID_HEADER = API_CONFIG.REQUEST_ID_HEADER;

const buildLoggerStub = () => ({
  setLogLevel: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
});

const setup = () => {
  const logger = buildLoggerStub();

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([loggingInterceptor])),
      provideHttpClientTesting(),
      { provide: LoggerService, useValue: logger },
    ],
  });

  return {
    logger,
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
  };
};

describe('loggingInterceptor', () => {
  it('attaches a generated request id header when none is present', () => {
    const { http, controller } = setup();

    http.get(TARGET_URL).subscribe();

    const req = controller.expectOne(TARGET_URL);

    expect(req.request.headers.has(REQUEST_ID_HEADER)).toBe(true);
    expect(req.request.headers.get(REQUEST_ID_HEADER)).toBeTruthy();

    req.flush({});
    controller.verify();
  });

  it('keeps an existing request id header untouched', () => {
    const { http, controller } = setup();

    http
      .get(TARGET_URL, { headers: { [REQUEST_ID_HEADER]: 'fixed-id' } })
      .subscribe();

    const req = controller.expectOne(TARGET_URL);

    expect(req.request.headers.get(REQUEST_ID_HEADER)).toBe('fixed-id');

    req.flush({});
    controller.verify();
  });

  it('logs a success entry on a 2xx response', () => {
    const { http, controller, logger } = setup();

    http.get(TARGET_URL).subscribe();
    controller.expectOne(TARGET_URL).flush({ value: 1 });

    expect(logger.log).toHaveBeenCalledTimes(1);

    const [namespace, entry] = logger.log.mock.calls[0];

    expect(namespace).toBe('HttpClient');
    expect(entry).toMatchObject({
      endpoint: TARGET_URL,
      method: 'GET',
      statusCode: 200,
      response: { value: 1 },
    });
    expect(entry.requestId).toBeTruthy();
    controller.verify();
  });

  it('captures query params in the entry', () => {
    const { http, controller, logger } = setup();
    const params = new HttpParams()
      .set('page', '1')
      .append('tag', 'a')
      .append('tag', 'b');

    http.get(TARGET_URL, { params }).subscribe();
    controller.expectOne(`${TARGET_URL}?page=1&tag=a&tag=b`).flush({});

    const [, entry] = logger.log.mock.calls[0];

    expect(entry.query).toEqual({ page: '1', tag: ['a', 'b'] });
    controller.verify();
  });

  it('reports a null query when there are no params', () => {
    const { http, controller, logger } = setup();

    http.get(TARGET_URL).subscribe();
    controller.expectOne(TARGET_URL).flush({});

    const [, entry] = logger.log.mock.calls[0];

    expect(entry.query).toBeNull();
    controller.verify();
  });

  it('sanitizes sensitive keys in the request body', () => {
    const { http, controller, logger } = setup();

    http.post(TARGET_URL, { email: 'a@b.c', password: 'secret' }).subscribe();
    controller.expectOne(TARGET_URL).flush({});

    const [, entry] = logger.log.mock.calls[0];

    expect(entry.body).toEqual({ email: 'a@b.c', password: '[SANITIZED]' });
    controller.verify();
  });

  it('logs a warning for 4xx errors', () => {
    const { http, controller, logger } = setup();

    http.get(TARGET_URL).subscribe({ error: () => undefined });
    controller
      .expectOne(TARGET_URL)
      .flush({ message: 'nope' }, { status: 404, statusText: 'Not Found' });

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();

    const [, entry] = logger.warn.mock.calls[0];

    expect(entry.statusCode).toBe(404);
    expect(entry.response).toEqual({ message: 'nope' });
    controller.verify();
  });

  it('logs an error for 5xx responses', () => {
    const { http, controller, logger } = setup();

    http.get(TARGET_URL).subscribe({ error: () => undefined });
    controller
      .expectOne(TARGET_URL)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();

    const [, entry] = logger.error.mock.calls[0];

    expect(entry.statusCode).toBe(500);
    controller.verify();
  });

  it('logs an error with status 0 on a network failure', () => {
    const { http, controller, logger } = setup();

    http.get(TARGET_URL).subscribe({ error: () => undefined });
    controller
      .expectOne(TARGET_URL)
      .error(new ProgressEvent('error'), { status: 0, statusText: '' });

    expect(logger.error).toHaveBeenCalledTimes(1);

    const [, entry] = logger.error.mock.calls[0];

    expect(entry.statusCode).toBe(0);
    controller.verify();
  });
});
