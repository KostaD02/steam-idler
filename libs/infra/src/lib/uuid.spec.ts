import { generateUuid } from './uuid';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUuid', () => {
  it('produces a v4 formatted identifier', () => {
    expect(generateUuid()).toMatch(UUID_V4);
  });

  it('produces a different value on each call', () => {
    expect(generateUuid()).not.toBe(generateUuid());
  });
});
