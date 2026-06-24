import { maskString } from './mask';

describe('maskString', () => {
  it.each(['', 'a'])('returns short values untouched: %p', (value) => {
    expect(maskString(value)).toBe(value);
  });

  it('keeps a single character for a short name', () => {
    expect(maskString('bob')).toBe('b**');
  });

  it('keeps two characters for a name of length two', () => {
    expect(maskString('ab')).toBe('a*');
  });

  it('keeps up to a third of the characters visible', () => {
    expect(maskString('steamuser')).toBe('ste******');
  });

  it('respects an explicit visible count', () => {
    expect(maskString('abcdef', 2)).toBe('ab****');
  });
});
