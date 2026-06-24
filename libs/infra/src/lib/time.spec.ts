import { formatRelativeTime } from './time';

describe('formatRelativeTime', () => {
  const NOW = new Date('2024-06-15T12:00:00.000Z').getTime();

  const isoFromNow = (msOffset: number): string =>
    new Date(NOW + msOffset).toISOString();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats seconds in the past', () => {
    expect(formatRelativeTime(isoFromNow(-5 * 1000))).toBe('5 seconds ago');
  });

  it('formats minutes in the future', () => {
    expect(formatRelativeTime(isoFromNow(3 * 60 * 1000))).toBe('in 3 minutes');
  });

  it('formats hours in the past', () => {
    expect(formatRelativeTime(isoFromNow(-2 * 60 * 60 * 1000))).toBe(
      '2 hours ago',
    );
  });

  it('formats days in the past', () => {
    expect(formatRelativeTime(isoFromNow(-3 * 24 * 60 * 60 * 1000))).toBe(
      '3 days ago',
    );
  });

  it('falls back to years for very old timestamps', () => {
    expect(
      formatRelativeTime(isoFromNow(-2 * 365 * 24 * 60 * 60 * 1000)),
    ).toContain('years ago');
  });
});
