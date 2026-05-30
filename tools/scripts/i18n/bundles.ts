import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { DEFAULT_LOCALE, I18N_DIR, ROOT } from './constants';
import { NestedBundle } from './types';

export function discoverLocales(): string[] {
  return readdirSync(resolve(ROOT, I18N_DIR))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort((a, b) =>
      a === DEFAULT_LOCALE ? -1 : b === DEFAULT_LOCALE ? 1 : a.localeCompare(b),
    );
}

export function loadBundle(locale: string): NestedBundle {
  const path = resolve(ROOT, I18N_DIR, `${locale}.json`);

  try {
    return JSON.parse(readFileSync(path, 'utf8')) as NestedBundle;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `❌ Failed to parse ${I18N_DIR}/${locale}.json:\n  ${message}`,
    );
    process.exit(1);
  }
}
