import { SafeAny } from './safe-any';

type MessageType = SafeAny;

interface Console {
  log(message: MessageType, ...optionalParams: MessageType[]): void;
  error(message: MessageType, ...optionalParams: MessageType[]): void;
  warn(message: MessageType, ...optionalParams: MessageType[]): void;
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

  constructor(
    public environment: string,
    public namespace = '',
    private consoleInstance: Console = console,
  ) {
    this.console = consoleInstance;
  }

  log(message: MessageType, ...optionalParams: MessageType[]): void {
    this.logger('log', message, ...optionalParams);
  }

  error(message: MessageType, ...optionalParams: MessageType[]): void {
    this.logger('error', message, ...optionalParams);
  }

  warn(message: MessageType, ...optionalParams: MessageType[]): void {
    this.logger('warn', message, ...optionalParams);
  }

  private logger(
    type: SteamIdlerLogType,
    message: MessageType,
    ...optionalParams: MessageType[]
  ): void {
    const date = new Date();
    const timestamp = date
      .toLocaleString('en-GB', this.timeFormat)
      .replace(/\//g, '.');

    this.console[type](
      `[${this.environment}] - ${timestamp} ${type.toUpperCase()} [${
        this.namespace
      }]`,
      message,
      ...optionalParams,
    );
  }
}
