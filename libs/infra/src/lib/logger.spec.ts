import { SteamIdlerLogger } from './logger';

const buildConsoleStub = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
});

describe('SteamIdlerLogger', () => {
  it('forwards log calls to the console with a namespaced prefix', () => {
    const consoleStub = buildConsoleStub();
    const logger = new SteamIdlerLogger(consoleStub);

    logger.log('auth', 'hello', 1);

    expect(consoleStub.log).toHaveBeenCalledTimes(1);

    const [prefix, message, extra] = consoleStub.log.mock.calls[0];

    expect(prefix).toContain('LOG [auth]');
    expect(message).toBe('hello');
    expect(extra).toBe(1);
  });

  it('routes error and warn to the matching console method', () => {
    const consoleStub = buildConsoleStub();
    const logger = new SteamIdlerLogger(consoleStub);

    logger.error('cache', 'boom');
    logger.warn('cache', 'careful');

    expect(consoleStub.error.mock.calls[0][0]).toContain('ERROR [cache]');
    expect(consoleStub.warn.mock.calls[0][0]).toContain('WARN [cache]');
  });

  it('falls back to the global console when none is provided', () => {
    expect(new SteamIdlerLogger().console).toBe(globalThis.console);
  });
});
