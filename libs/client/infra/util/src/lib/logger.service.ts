import { Injectable } from '@angular/core';

import { SteamIdlerLogger, SteamIdlerMessageType } from '@steam-idler/infra';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly logger = new SteamIdlerLogger();

  // TODO: read config and based on that display log

  log(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    this.logger.log(namespace, message, ...optionalParams);
  }

  error(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    this.logger.error(namespace, message, ...optionalParams);
  }

  warn(
    namespace: string,
    message: SteamIdlerMessageType,
    ...optionalParams: SteamIdlerMessageType[]
  ): void {
    this.logger.warn(namespace, message, ...optionalParams);
  }
}
