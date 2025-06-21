import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger = new Logger(AppLoggerService.name);

  setContext(context: string) {
    this.logger = new Logger(context);
  }

  log(message: unknown): void {
    this.logger.log(message);
  }

  error(message: unknown): void {
    // TODO: save it in db?
    this.logger.error(message);
  }

  warn(message: unknown): void {
    this.logger.warn(message);
  }

  debug(message: unknown): void {
    this.logger.debug(message);
  }

  verbose(message: unknown): void {
    this.logger.verbose(message);
  }

  fatal(message: unknown): void {
    // TODO: save it in db?
    this.logger.fatal(message);
  }
}
