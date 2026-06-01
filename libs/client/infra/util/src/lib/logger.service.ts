import { Injectable } from '@angular/core';

import {
  LogLevel,
  LogLevelEnum,
  SteamIdlerLogger,
  SteamIdlerMessageType,
} from '@steam-idler/infra';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly logger = new SteamIdlerLogger();

  private logLevel: LogLevel = LogLevelEnum.All;

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  log(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    if (this.logLevel < LogLevelEnum.All) {
      return;
    }

    this.logger.log(namespace, message, ...optionalParams);
  }

  error(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    if (this.logLevel < LogLevelEnum.ErrorOnly) {
      return;
    }

    this.logger.error(namespace, message, ...optionalParams);
  }

  warn(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    if (this.logLevel < LogLevelEnum.All) {
      return;
    }

    this.logger.warn(namespace, message, ...optionalParams);
  }
}
