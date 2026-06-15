import { TranslationParams } from '@steam-idler/client/i18n/types';

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

export function interpolate(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
