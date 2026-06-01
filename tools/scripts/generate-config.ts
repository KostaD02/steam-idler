import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');
const ENV_PATH = resolve(ROOT, './.env');
const ENV_EXAMPLE_PATH = resolve(ROOT, './.env.example');
const CONFIG_FILE = resolve(ROOT, './dist/apps/client/browser/config.json');

const CLIENT_RELATED_KEYS = ['SERVER_PORT'];

function generateObject(
  text: string,
  clientRelatedKeys: string[],
): Record<string, string> {
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

    if (!clientRelatedKeys.includes(key)) {
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

function run(): void {
  try {
    const envFile = readEnvFile();
    const config = generateObject(envFile, CLIENT_RELATED_KEYS);
    rmSync(CONFIG_FILE, { force: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('✅ Successfully finished writing .env to config.json');
  } catch (err) {
    console.error('❌ Error while writing .env to config.json');
    console.error('Reason', err);
  }
}

run();
