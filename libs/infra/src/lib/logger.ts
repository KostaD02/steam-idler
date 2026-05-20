import { SafeAny } from './safe-any';

export type SteamIdlerMessageType = SafeAny;

interface Console {
  log(
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void;
  error(
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void;
  warn(
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void;
}

export type SteamIdlerLogType = 'log' | 'error' | 'warn';

export class SteamIdlerLogger implements Console {
  readonly console: Console;

  readonly timeFormat: Record<string, '2-digit' | 'numeric'> = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  constructor(private consoleInstance: Console = console) {
    this.console = consoleInstance;
  }

  log(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    this.logger('log', namespace, message, ...optionalParams);
  }

  error(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    this.logger('error', namespace, message, ...optionalParams);
  }

  warn(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    this.logger('warn', namespace, message, ...optionalParams);
  }

  private logger(
    type: SteamIdlerLogType,
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    const date = new Date();
    const timestamp = date
      .toLocaleString('en-GB', this.timeFormat)
      .replace(/\//g, '.');

    this.console[type](
      `${timestamp} ${type.toUpperCase()} [${namespace}]`,
      message,
      ...optionalParams,
    );
  }
}
