import { LogLevel } from '@steam-idler/infra';

export interface EnvVariables {
  DATABASE_URL: string;
  SERVER_PORT: number;
  SERVER_LOG_TYPE: LogLevel;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: number;
}
