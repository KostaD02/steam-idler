import { type HttpErrorResponse } from '@angular/common/http';

import { type HttpExceptionResponse } from '@steam-idler/infra';

const FALLBACK_ERROR_KEY = 'errors.common.app_error';

function isGenericStatusKey(key: string): boolean {
  return key.split('.').length <= 2;
}

export function extractErrorKey(error: HttpErrorResponse): string {
  const keys = (error.error as HttpExceptionResponse | null)?.errorKeys;

  if (!keys?.length) {
    return FALLBACK_ERROR_KEY;
  }

  return keys.find((key) => !isGenericStatusKey(key)) ?? keys[0];
}
