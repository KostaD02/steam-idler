import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger = new Logger(AppLoggerService.name);

  log(message: unknown): void {
    this.logger.log(message);
  }

  error(message: unknown): void {
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
    this.logger.fatal(message);
  }
}
