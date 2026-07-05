import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@steam-idler/infra';

import { ConfigSchema } from '@steam-idler/client/infra/types';

import { ConfigService } from './config.service';
import { versionInterceptor } from './version.interceptor';

const TARGET_URL = '/resource';
const CLIENT_VERSION_HEADER = API_CONFIG.CLIENT_VERSION_HEADER;

const DEFAULT_CONFIG: ConfigSchema = {
  apiBase: 'http://localhost:2221/api',
  version: '1.2.3',
  logType: 2,
};

const setup = (config: ConfigSchema | null = DEFAULT_CONFIG) => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([versionInterceptor])),
      provideHttpClientTesting(),
      { provide: ConfigService, useValue: { config } },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
  };
};

describe('versionInterceptor', () => {
  it('attaches the client version header', () => {
    const { http, controller } = setup();

    http.get(TARGET_URL).subscribe();

    const req = controller.expectOne(TARGET_URL);

    expect(req.request.headers.get(CLIENT_VERSION_HEADER)).toBe('1.2.3');

    req.flush({});
    controller.verify();
  });

  it('skips the header when the config is missing', () => {
    const { http, controller } = setup(null);

    http.get(TARGET_URL).subscribe();

    const req = controller.expectOne(TARGET_URL);

    expect(req.request.headers.has(CLIENT_VERSION_HEADER)).toBe(false);

    req.flush({});
    controller.verify();
  });

  it('skips the header when the version is empty', () => {
    const { http, controller } = setup({ ...DEFAULT_CONFIG, version: '' });

    http.get(TARGET_URL).subscribe();

    const req = controller.expectOne(TARGET_URL);

    expect(req.request.headers.has(CLIENT_VERSION_HEADER)).toBe(false);

    req.flush({});
    controller.verify();
  });
});
