export type NestedBundle = { [key: string]: string | NestedBundle };

export type FlatBundle = Record<string, string>;

export interface LocaleRow {
  locale: string;
  label: string;
  count: number;
  percent: number;
}

export interface ReportData {
  defaultLocale: string;
  defaultFlatCount: number;
  requiredCount: number;
  locales: LocaleRow[];
}
