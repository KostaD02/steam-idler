import { TestBed } from '@angular/core/testing';

import { LogLevelEnum, SteamIdlerLogger } from '@steam-idler/infra';

import { LoggerService } from './logger.service';

const setup = () => {
  const log = jest
    .spyOn(SteamIdlerLogger.prototype, 'log')
    .mockImplementation();
  const error = jest
    .spyOn(SteamIdlerLogger.prototype, 'error')
    .mockImplementation();
  const warn = jest
    .spyOn(SteamIdlerLogger.prototype, 'warn')
    .mockImplementation();

  TestBed.configureTestingModule({ providers: [LoggerService] });
  const service = TestBed.inject(LoggerService);

  return { service, log, error, warn };
};

describe('LoggerService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log', () => {
    it('delegates to the underlying logger with namespace, message and params', () => {
      const { service, log } = setup();

      service.log('Auth', 'signed in', 'extra');

      expect(log).toHaveBeenCalledWith('Auth', 'signed in', 'extra');
    });

    it('is suppressed when the log level is below All', () => {
      const { service, log } = setup();
      service.setLogLevel(LogLevelEnum.ErrorOnly);

      service.log('Auth', 'signed in');

      expect(log).not.toHaveBeenCalled();
    });

    it('is suppressed when logging is disabled entirely', () => {
      const { service, log } = setup();
      service.setLogLevel(LogLevelEnum.None);

      service.log('Auth', 'signed in');

      expect(log).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('delegates to the underlying logger', () => {
      const { service, warn } = setup();

      service.warn('Auth', 'careful');

      expect(warn).toHaveBeenCalledWith('Auth', 'careful');
    });

    it('is suppressed when the log level is below All', () => {
      const { service, warn } = setup();
      service.setLogLevel(LogLevelEnum.ErrorOnly);

      service.warn('Auth', 'careful');

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('delegates to the underlying logger with all params', () => {
      const { service, error } = setup();

      service.error('Auth', 'boom', { code: 500 });

      expect(error).toHaveBeenCalledWith('Auth', 'boom', { code: 500 });
    });

    it('still emits at ErrorOnly level', () => {
      const { service, error } = setup();
      service.setLogLevel(LogLevelEnum.ErrorOnly);

      service.error('Auth', 'boom');

      expect(error).toHaveBeenCalledWith('Auth', 'boom');
    });

    it('is suppressed when logging is disabled entirely', () => {
      const { service, error } = setup();
      service.setLogLevel(LogLevelEnum.None);

      service.error('Auth', 'boom');

      expect(error).not.toHaveBeenCalled();
    });
  });
});
