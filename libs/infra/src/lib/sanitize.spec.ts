import { sanitizeObject } from './sanitize';

describe('sanitizeObject', () => {
  it('replaces blacklisted keys with a placeholder', () => {
    const result = sanitizeObject({ password: 'secret', name: 'bob' }, [
      'password',
    ]);

    expect(result).toEqual({ password: '[SANITIZED]', name: 'bob' });
  });

  it('sanitizes nested objects recursively', () => {
    const result = sanitizeObject(
      { user: { password: 'secret', name: 'bob' } },
      ['password'],
    );

    expect(result).toEqual({
      user: { password: '[SANITIZED]', name: 'bob' },
    });
  });

  it('does not recurse into mongoose identifier keys', () => {
    const id = { nested: 'value' };

    const result = sanitizeObject({ _id: id }, ['nested']);

    expect(result._id).toBe(id);
  });

  it('leaves null values in place', () => {
    expect(sanitizeObject({ value: null }, ['password'])).toEqual({
      value: null,
    });
  });

  it('returns non-object input unchanged', () => {
    expect(sanitizeObject(null as never, ['password'])).toBeNull();
  });
});
