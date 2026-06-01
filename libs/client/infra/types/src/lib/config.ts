import { LogLevel } from '@steam-idler/infra';

export interface ConfigSchema {
  apiBase: string;
  version: string;
  logType: LogLevel;
}
