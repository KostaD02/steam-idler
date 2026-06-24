import { TZ_OFFSET, USER_EMAIL_REGEX } from './const';

describe('USER_EMAIL_REGEX', () => {
  it.each([
    'user@example.com',
    'first.last@example.co.uk',
    'name+tag@gmail.com',
    'a1@b2.dev',
  ])('accepts a valid address: %s', (email) => {
    expect(USER_EMAIL_REGEX.test(email)).toBe(true);
  });

  it.each([
    'plainaddress',
    '@no-local.com',
    'no-domain@',
    'double..dot@example.com',
    'trailing.dot.@example.com',
    'spaces in@example.com',
    'no-tld@example',
  ])('rejects an invalid address: %s', (email) => {
    expect(USER_EMAIL_REGEX.test(email)).toBe(false);
  });
});

describe('TZ_OFFSET', () => {
  it('is zero', () => {
    expect(TZ_OFFSET).toBe(0);
  });
});
