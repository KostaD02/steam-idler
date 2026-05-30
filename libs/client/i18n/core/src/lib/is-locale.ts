import { Locale } from '@steam-idler/client/i18n/types';

export function isLocale(
  value: string | null | undefined,
  supportedLocales: string[],
): value is Locale {
  return !!value && supportedLocales.includes(value);
}
