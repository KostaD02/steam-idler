import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');
const ENV_PATH = resolve(ROOT, './.env');
const ENV_EXAMPLE_PATH = resolve(ROOT, './.env.example');
const PACKAGE_JSON_PATH = resolve(ROOT, './package.json');
const CONFIG_FILE = resolve(ROOT, './dist/apps/client/browser/config.json');

const DEFAULT_LOG_TYPE = 2;

interface ClientConfig {
  apiBase: string;
  logType: number;
  version: string;
}

function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const eq = line.indexOf('=');

    if (eq === -1) {
      continue;
    }

    const key = line.slice(0, eq).trim();

    if (key === '') {
      continue;
    }

    result[key] = line.slice(eq + 1).trim();
  }

  return result;
}

function readEnvFile(): string {
  try {
    return readFileSync(ENV_PATH, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }

    console.warn('⚠️  .env not found, falling back to .env.example');
    return readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  }
}

function readVersion(): string {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as {
    version?: string;
  };

  return pkg.version ?? 'unknown';
}

function toLogType(value: string | undefined): number {
  const parsed = Number(value);

  return parsed === 0 || parsed === 1 || parsed === 2
    ? parsed
    : DEFAULT_LOG_TYPE;
}

function buildConfig(env: Record<string, string>): ClientConfig {
  const serverIp = env['SERVER_IP'] || 'localhost';
  const serverPort = env['SERVER_PORT'] || '2221';

  return {
    apiBase: `http://${serverIp}:${serverPort}/api`,
    logType: toLogType(env['CLIENT_LOG_TYPE']),
    version: readVersion(),
  };
}

function run(): void {
  try {
    const env = parseEnv(readEnvFile());
    const config = buildConfig(env);
    rmSync(CONFIG_FILE, { force: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('✅ Successfully finished writing .env to config.json');
  } catch (err) {
    console.error('❌ Error while writing .env to config.json');
    console.error('Reason', err);
  }
}

run();
