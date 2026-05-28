import { HttpErrorResponse } from '@angular/common/http';

import { AuthExpectionKeys } from '@steam-idler/server/auth/types';

import { extractAuthErrorMessage } from './auth-error.util';

const buildError = (body: unknown): HttpErrorResponse =>
  ({ error: body }) as HttpErrorResponse;

describe('extractAuthErrorMessage', () => {
  it('maps a known errorKey to a friendly message', () => {
    const err = buildError({
      errorKeys: [AuthExpectionKeys.InvalidCredentials],
    });
    expect(extractAuthErrorMessage(err)).toBe(
      'Email or password is incorrect.',
    );
  });

  it('maps EmailInUse to its friendly message', () => {
    const err = buildError({ errorKeys: [AuthExpectionKeys.EmailInUse] });
    expect(extractAuthErrorMessage(err)).toBe(
      'An account with this email already exists.',
    );
  });

  it('falls back to body.message when errorKey is not mapped', () => {
    const err = buildError({
      errorKeys: ['errors.auth.some_unmapped_key'],
      message: 'Specific server message',
    });
    expect(extractAuthErrorMessage(err)).toBe('Specific server message');
  });

  it('falls back to the first element when message is an array', () => {
    const err = buildError({ message: ['first issue', 'second issue'] });
    expect(extractAuthErrorMessage(err)).toBe('first issue');
  });

  it('returns the generic message when nothing matches', () => {
    expect(extractAuthErrorMessage(buildError(null))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(extractAuthErrorMessage(buildError({}))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
