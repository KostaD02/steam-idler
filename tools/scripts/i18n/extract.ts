import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ERROR_KEY_PATTERN,
  EXCEPTION_KEY_FILES,
  LABEL_PATTERN,
  LOCALE_TYPES_FILE,
  ROOT,
} from './constants';

export function extractRequiredKeys(): Set<string> {
  const keys = new Set<string>();

  for (const file of EXCEPTION_KEY_FILES) {
    const text = readFileSync(resolve(ROOT, file), 'utf8');

    for (const match of text.matchAll(ERROR_KEY_PATTERN)) {
      keys.add(match[1]);
    }
  }

  return keys;
}

export function extractLocaleLabels(): Record<string, string> {
  let text: string;

  try {
    text = readFileSync(resolve(ROOT, LOCALE_TYPES_FILE), 'utf8');
  } catch {
    return {};
  }

  const labelsBlockMatch = text.match(/LOCALE_LABELS[\s\S]*?\{([\s\S]*?)\}/);

  if (!labelsBlockMatch) {
    return {};
  }

  const block = labelsBlockMatch[1];
  const labels: Record<string, string> = {};

  for (const match of block.matchAll(LABEL_PATTERN)) {
    labels[match[1]] = match[2];
  }

  return labels;
}
