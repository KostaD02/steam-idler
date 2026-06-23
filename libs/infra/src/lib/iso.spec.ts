import { getISOString, getTzOffsetDate } from './iso';

describe('getISOString', () => {
  it('returns the ISO string for a Date', () => {
    const date = new Date('2024-06-15T12:30:00.000Z');

    expect(getISOString(date)).toBe('2024-06-15T12:30:00.000Z');
  });

  it('parses a string date before serializing', () => {
    expect(getISOString('2024-01-01T00:00:00.000Z')).toBe(
      '2024-01-01T00:00:00.000Z',
    );
  });
});

describe('getTzOffsetDate', () => {
  it('keeps the same instant for a Date input', () => {
    const date = new Date('2024-06-15T12:30:00.000Z');

    expect(getTzOffsetDate(date).getTime()).toBe(date.getTime());
  });

  it('parses a string date input', () => {
    const expected = Date.parse('2024-01-01T00:00:00.000Z');

    expect(getTzOffsetDate('2024-01-01T00:00:00.000Z').getTime()).toBe(
      expected,
    );
  });
});
