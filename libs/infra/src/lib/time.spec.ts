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

  it('formats using the given locale', () => {
    expect(formatRelativeTime(isoFromNow(-5 * 60 * 1000), 'zh-CN')).toBe(
      '5分钟前',
    );
    expect(formatRelativeTime(isoFromNow(-5 * 60 * 1000), 'ka')).toBe(
      '5 წუთის წინ',
    );
  });

  it('falls back to bundled patterns when Intl lacks the locale', () => {
    jest
      .spyOn(Intl.RelativeTimeFormat, 'supportedLocalesOf')
      .mockReturnValue([]);

    jest.isolateModules(() => {
      const { formatRelativeTime: isolated } =
        jest.requireActual<typeof import('./time')>('./time');

      expect(isolated(isoFromNow(-5 * 60 * 1000), 'ka')).toBe('5 წუთის წინ');
      expect(isolated(isoFromNow(-1 * 60 * 60 * 1000), 'ka')).toBe(
        '1 საათის წინ',
      );
      expect(isolated(isoFromNow(2 * 60 * 60 * 1000), 'ka')).toBe('2 საათში');
    });
  });

  it('falls back to years for very old timestamps', () => {
    expect(
      formatRelativeTime(isoFromNow(-2 * 365 * 24 * 60 * 60 * 1000)),
    ).toContain('years ago');
  });
});
