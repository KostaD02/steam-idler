const DEFAULT_LOCALE = 'en';

const AVG_WEEKS_PER_MONTH = 365 / 12 / 7;

const TIME_DIVISIONS: ReadonlyArray<{
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: AVG_WEEKS_PER_MONTH, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

type RelativeTimePatterns = Partial<
  Record<Intl.RelativeTimeFormatUnit, { past: string; future: string }>
>;

const UNSUPPORTED_LOCALE_PATTERNS: Record<string, RelativeTimePatterns> = {
  ka: {
    seconds: { past: '{n} წამის წინ', future: '{n} წამში' },
    minutes: { past: '{n} წუთის წინ', future: '{n} წუთში' },
    hours: { past: '{n} საათის წინ', future: '{n} საათში' },
    days: { past: '{n} დღის წინ', future: '{n} დღეში' },
    weeks: { past: '{n} კვირის წინ', future: '{n} კვირაში' },
    months: { past: '{n} თვის წინ', future: '{n} თვეში' },
    years: { past: '{n} წლის წინ', future: '{n} წელიწადში' },
  },
};

const FORMATTERS = new Map<string, Intl.RelativeTimeFormat | null>();

function relativeTimeFormat(locale: string): Intl.RelativeTimeFormat | null {
  if (!FORMATTERS.has(locale)) {
    const supported =
      Intl.RelativeTimeFormat.supportedLocalesOf([locale]).length > 0;

    FORMATTERS.set(
      locale,
      supported
        ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
        : null,
    );
  }

  return FORMATTERS.get(locale) ?? null;
}

function formatValue(
  locale: string,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
): string {
  const formatter = relativeTimeFormat(locale);

  if (formatter) {
    return formatter.format(value, unit);
  }

  const patterns = UNSUPPORTED_LOCALE_PATTERNS[locale]?.[unit];

  if (!patterns) {
    return formatValue(DEFAULT_LOCALE, value, unit);
  }

  const pattern = value < 0 ? patterns.past : patterns.future;

  return pattern.replace('{n}', String(Math.abs(value)));
}

export function formatRelativeTime(
  iso: string,
  locale: string = DEFAULT_LOCALE,
): string {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000;

  for (const { amount, unit } of TIME_DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return formatValue(locale, Math.round(duration), unit);
    }

    duration /= amount;
  }

  return formatValue(locale, Math.round(duration), 'years');
}
