import { UserEmailValidator } from './auth.validator';

describe('UserEmailValidator', () => {
  it('is named email', () => {
    expect(UserEmailValidator.name).toBe('email');
  });

  describe('validator', () => {
    it('accepts a well-formed address', () => {
      expect(UserEmailValidator.validator('user@example.com')).toBe(true);
    });

    it('accepts addresses with allowed separators in the local part', () => {
      expect(
        UserEmailValidator.validator('first.last+tag@sub.example.com'),
      ).toBe(true);
    });

    it('rejects an address without an @ symbol', () => {
      expect(UserEmailValidator.validator('userexample.com')).toBe(false);
    });

    it('rejects an address without a top-level domain', () => {
      expect(UserEmailValidator.validator('user@example')).toBe(false);
    });

    it('rejects consecutive dots in the local part', () => {
      expect(UserEmailValidator.validator('first..last@example.com')).toBe(
        false,
      );
    });

    it('rejects an empty value', () => {
      expect(UserEmailValidator.validator('')).toBe(false);
    });
  });
});
