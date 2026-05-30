import { discoverLocales, loadBundle } from './bundles';
import { DEFAULT_LOCALE, I18N_DIR, REPORT_DIR } from './constants';
import { extractLocaleLabels, extractRequiredKeys } from './extract';
import { flatten } from './flatten';
import { writeReports } from './report';
import { LocaleRow, ReportData } from './types';

export function run(): void {
  const locales = discoverLocales();

  if (!locales.includes(DEFAULT_LOCALE)) {
    console.error(
      `❌ Default locale ${DEFAULT_LOCALE}.json is missing from ${I18N_DIR}.`,
    );
    process.exit(1);
  }

  const labels = extractLocaleLabels();
  const required = extractRequiredKeys();
  const defaultFlat = flatten(loadBundle(DEFAULT_LOCALE));
  const defaultFlatCount = Object.keys(defaultFlat).length;

  const missing = [...required].filter((key) => !(key in defaultFlat));

  if (missing.length) {
    console.error(
      `❌ ${missing.length} BE error keys missing from ${I18N_DIR}/${DEFAULT_LOCALE}.json:\n` +
        missing
          .sort()
          .map((k) => `  - ${k}`)
          .join('\n'),
    );
    process.exit(1);
  }

  const orphans: string[] = [];
  const rows: LocaleRow[] = locales.map((locale) => {
    const flat =
      locale === DEFAULT_LOCALE ? defaultFlat : flatten(loadBundle(locale));

    if (locale !== DEFAULT_LOCALE) {
      for (const key of Object.keys(flat)) {
        if (!(key in defaultFlat)) orphans.push(`${locale}: ${key}`);
      }
    }

    const count = Object.keys(flat).length;
    const percent = Math.round((count / defaultFlatCount) * 100);
    return { locale, label: labels[locale] ?? locale, count, percent };
  });

  if (orphans.length) {
    console.error(
      `❌ ${orphans.length} key(s) exist in a locale but not in ${DEFAULT_LOCALE}.json ` +
        `(no fallback - likely a typo or stale key):\n` +
        orphans
          .sort()
          .map((entry) => `  - ${entry}`)
          .join('\n'),
    );
    process.exit(1);
  }

  for (const row of rows) {
    console.log(
      `✅ ${row.locale}.json (${row.label}): ${row.count}/${defaultFlatCount} (${row.percent}%)`,
    );
  }

  const reportData: ReportData = {
    defaultLocale: DEFAULT_LOCALE,
    defaultFlatCount,
    requiredCount: required.size,
    locales: rows,
  };
  writeReports(reportData);
  console.log(`📝 Report written to ${REPORT_DIR}/i18n-report.{json,md}.`);
}
