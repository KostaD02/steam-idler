import { type HttpExceptionResponse } from '@steam-idler/infra';

import { extractErrorKey } from './http-error.util';

const FALLBACK_ERROR_KEY = 'errors.common.app_error';

const buildError = (errorKeys: string[] | undefined) =>
  ({
    error: { errorKeys } as unknown as HttpExceptionResponse,
  }) as unknown;

describe('extractErrorKey', () => {
  it('returns the fallback key when the error is null', () => {
    expect(extractErrorKey(null)).toBe(FALLBACK_ERROR_KEY);
  });

  it('returns the fallback key when the error has no nested error body', () => {
    expect(extractErrorKey({})).toBe(FALLBACK_ERROR_KEY);
  });

  it('returns the fallback key when errorKeys is undefined', () => {
    expect(extractErrorKey(buildError(undefined))).toBe(FALLBACK_ERROR_KEY);
  });

  it('returns the fallback key when errorKeys is empty', () => {
    expect(extractErrorKey(buildError([]))).toBe(FALLBACK_ERROR_KEY);
  });

  it('returns the first specific key over a generic status key', () => {
    expect(
      extractErrorKey(
        buildError(['errors.common', 'errors.auth.token_expired']),
      ),
    ).toBe('errors.auth.token_expired');
  });

  it('skips generic two-segment keys in favour of a deeper key', () => {
    expect(
      extractErrorKey(
        buildError(['errors.unauthorized', 'errors.auth.invalid_credentials']),
      ),
    ).toBe('errors.auth.invalid_credentials');
  });

  it('falls back to the first key when every key is generic', () => {
    expect(extractErrorKey(buildError(['errors.bad', 'errors.worse']))).toBe(
      'errors.bad',
    );
  });

  it('returns a single specific key as-is', () => {
    expect(
      extractErrorKey(buildError(['errors.steam_account.not_found'])),
    ).toBe('errors.steam_account.not_found');
  });
});
