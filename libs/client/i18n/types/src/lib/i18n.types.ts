// To avoid circular dependencies, will define few constant here

export const LOCALE_LABELS = {
  en: 'English',
  ka: 'ქართული',
  es: 'Español',
  de: 'Deutsch',
  'pt-BR': 'Português (Brasil)',
  uk: 'Українська',
  tr: 'Türkçe',
  fr: 'Français',
  pl: 'Polski',
  ru: 'Русский',
  'zh-CN': '简体中文',
} as const;

export type Locale = keyof typeof LOCALE_LABELS;

export const SUPPORTED_LOCALES = Object.keys(LOCALE_LABELS) as Locale[];

export const DEFAULT_LOCALE: Locale = 'en';

export type TranslationKey = string;
export type TranslationParams = Record<string, string | number>;
export type FlatBundle = Record<string, string>;
export type NestedBundle = { [key: string]: string | NestedBundle };
