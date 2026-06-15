const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

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

export function formatRelativeTime(iso: string): string {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000;

  for (const { amount, unit } of TIME_DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return RELATIVE_TIME_FORMAT.format(Math.round(duration), unit);
    }

    duration /= amount;
  }

  return RELATIVE_TIME_FORMAT.format(Math.round(duration), 'years');
}
