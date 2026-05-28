import { HttpErrorResponse } from '@angular/common/http';

import { AuthExpectionKeys } from '@steam-idler/server/auth/types';

const ERROR_KEY_MESSAGES: Record<string, string> = {
  [AuthExpectionKeys.InvalidCredentials]: 'Email or password is incorrect.',
  [AuthExpectionKeys.EmailInUse]: 'An account with this email already exists.',
  [AuthExpectionKeys.InvalidEmail]: 'That email address looks invalid.',
  [AuthExpectionKeys.PasswordTooShort]: 'Password is too short.',
  [AuthExpectionKeys.PasswordTooLong]: 'Password is too long.',
  [AuthExpectionKeys.DisplayNameTooShort]: 'Display name is too short.',
  [AuthExpectionKeys.DisplayNameTooLong]: 'Display name is too long.',
};

export function extractAuthErrorMessage(err: HttpErrorResponse): string {
  const body = err.error as {
    errorKeys?: string[];
    message?: string | string[];
  } | null;
  const errorKey = body?.errorKeys?.[0];

  if (errorKey && ERROR_KEY_MESSAGES[errorKey]) {
    return ERROR_KEY_MESSAGES[errorKey];
  }

  const message = body?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.length) return message[0];

  return 'Something went wrong. Please try again.';
}
