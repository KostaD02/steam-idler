// To avoid circular dependencies, will define few constant here

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ka: 'ქართული',
};

export const SUPPORTED_LOCALES = ['en', 'ka'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type TranslationKey = string;
export type TranslationParams = Record<string, string | number>;
export type FlatBundle = Record<string, string>;
export type NestedBundle = { [key: string]: string | NestedBundle };
