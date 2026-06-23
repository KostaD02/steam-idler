import { formatPlaytime } from './duration';

describe('formatPlaytime', () => {
  it.each([0, -10, Number.NaN, Number.POSITIVE_INFINITY])(
    'returns 0h for non-positive or non-finite input: %p',
    (minutes) => {
      expect(formatPlaytime(minutes)).toBe('0h');
    },
  );

  it('reports whole minutes below an hour', () => {
    expect(formatPlaytime(30)).toBe('30min');
  });

  it('rounds fractional minutes below an hour', () => {
    expect(formatPlaytime(45.4)).toBe('45min');
  });

  it('reports hours with one decimal at the hour boundary', () => {
    expect(formatPlaytime(60)).toBe('1.0h');
  });

  it('reports fractional hours', () => {
    expect(formatPlaytime(150)).toBe('2.5h');
  });
});
