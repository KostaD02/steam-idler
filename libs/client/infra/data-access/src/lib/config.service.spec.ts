import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LogLevelEnum } from '@steam-idler/infra';

import { ConfigSchema } from '@steam-idler/client/infra/types';
import { LoggerService } from '@steam-idler/client/infra/util';

import { ConfigService } from './config.service';

const CONFIG: ConfigSchema = {
  apiBase: 'https://api.example.com',
  version: '1.2.3',
  logType: LogLevelEnum.ErrorOnly,
};

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
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: LoggerService, useValue: logger },
    ],
  });

  return {
    service: TestBed.inject(ConfigService),
    controller: TestBed.inject(HttpTestingController),
    logger,
  };
};

describe('ConfigService', () => {
  it('starts with a null config', () => {
    const { service } = setup();

    expect(service.config).toBeNull();
  });

  describe('load', () => {
    it('fetches config.json and stores the response', async () => {
      const { service, controller } = setup();

      const pending = service.load();
      controller.expectOne('/config.json').flush(CONFIG);
      await pending;

      expect(service.config).toEqual(CONFIG);
      controller.verify();
    });

    it('freezes the loaded config', async () => {
      const { service, controller } = setup();

      const pending = service.load();
      controller.expectOne('/config.json').flush(CONFIG);
      await pending;

      expect(Object.isFrozen(service.config)).toBe(true);
    });

    it('applies the configured log level and logs the result', async () => {
      const { service, controller, logger } = setup();

      const pending = service.load();
      controller.expectOne('/config.json').flush(CONFIG);
      await pending;

      expect(logger.setLogLevel).toHaveBeenCalledWith(LogLevelEnum.ErrorOnly);
      expect(logger.log).toHaveBeenCalledWith(
        'ConfigService',
        'Config loaded',
        CONFIG,
      );
    });

    it('defaults the log level to All when logType is absent', async () => {
      const { service, controller, logger } = setup();

      const pending = service.load();
      controller.expectOne('/config.json').flush({ apiBase: '', version: '1' });
      await pending;

      expect(logger.setLogLevel).toHaveBeenCalledWith(LogLevelEnum.All);
    });

    it('logs an error and leaves config null when the request fails', async () => {
      const { service, controller, logger } = setup();

      const pending = service.load();
      controller
        .expectOne('/config.json')
        .flush('boom', { status: 500, statusText: 'Server Error' });
      await pending;

      expect(service.config).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'ConfigService',
        'Failed to load config',
      );
      controller.verify();
    });
  });
});
