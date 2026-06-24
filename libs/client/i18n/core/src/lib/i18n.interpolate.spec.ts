import { interpolate } from './i18n.interpolate';

describe('interpolate', () => {
  it('returns the template untouched when no params are given', () => {
    expect(interpolate('Hello {{name}}')).toBe('Hello {{name}}');
  });

  it('replaces a single placeholder with its value', () => {
    expect(interpolate('Hello {{name}}', { name: 'Sam' })).toBe('Hello Sam');
  });

  it('replaces multiple placeholders', () => {
    const result = interpolate('{{greeting}}, {{name}}', {
      greeting: 'Hi',
      name: 'Sam',
    });

    expect(result).toBe('Hi, Sam');
  });

  it('tolerates whitespace inside the braces', () => {
    expect(interpolate('Hello {{  name  }}', { name: 'Sam' })).toBe(
      'Hello Sam',
    );
  });

  it('coerces numeric values to strings', () => {
    expect(interpolate('You have {{count}} items', { count: 3 })).toBe(
      'You have 3 items',
    );
  });

  it('leaves the placeholder in place when the value is undefined', () => {
    expect(interpolate('Hello {{name}}', { other: 'x' })).toBe(
      'Hello {{name}}',
    );
  });

  it('returns the template unchanged when it has no placeholders', () => {
    expect(interpolate('plain text', { name: 'Sam' })).toBe('plain text');
  });
});
