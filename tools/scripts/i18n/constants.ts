import { resolve } from 'node:path';

export const ROOT = resolve(__dirname, '../../..');

export const EXCEPTION_KEY_FILES = [
  'libs/server/infra/types/src/lib/exception.ts',
  'libs/server/auth/types/src/lib/exceptions.ts',
  'libs/server/steam-account/types/src/lib/exceptions.ts',
];

export const LOCALE_TYPES_FILE = 'libs/client/i18n/types/src/lib/i18n.types.ts';

export const I18N_DIR = 'apps/client/public/i18n';
export const REPORT_DIR = 'tmp';
export const DEFAULT_LOCALE = 'en';

export const ERROR_KEY_PATTERN = /['"`](errors\.[a-z0-9_.]+)['"`]/g;

export const LABEL_PATTERN =
  /^\s*['"`]?([a-z]{2}(?:-[a-zA-Z]{2,})?)['"`]?:\s*['"`]([^'"`]+)['"`]/gm;
