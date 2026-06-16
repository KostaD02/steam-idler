import { LogLevel } from '@steam-idler/infra';

export interface EnvVariables {
  DATABASE_URL: string;
  SERVER_PORT: number;
  SERVER_LOG_TYPE: LogLevel;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: number;
  REDIS_ENABLED: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_TTL: number;
}
