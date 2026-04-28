export interface EnvVariables {
  DATABASE_URL: string;
  SERVER_PORT: number;
  SERVER_LOG_ENABLED: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: number;
}
