const MINUTES_PER_HOUR = 60;

export function formatPlaytime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '0h';
  }

  if (minutes < MINUTES_PER_HOUR) {
    return `${Math.round(minutes)}min`;
  }

  const hours = minutes / MINUTES_PER_HOUR;

  return `${hours.toFixed(1)}h`;
}
