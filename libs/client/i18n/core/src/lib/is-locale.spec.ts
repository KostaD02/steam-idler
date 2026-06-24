import { isLocale } from './is-locale';

const SUPPORTED = ['en', 'ka'];

describe('isLocale', () => {
  it('returns true for a supported locale', () => {
    expect(isLocale('en', SUPPORTED)).toBe(true);
  });

  it('returns false for an unsupported locale', () => {
    expect(isLocale('de', SUPPORTED)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isLocale(null, SUPPORTED)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isLocale(undefined, SUPPORTED)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isLocale('', SUPPORTED)).toBe(false);
  });

  it('returns false when the supported list is empty', () => {
    expect(isLocale('en', [])).toBe(false);
  });
});
