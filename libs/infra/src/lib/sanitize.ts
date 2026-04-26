import { SafeAny } from './safe-any';

const MONGOOSE_KEYS = ['_id', 'id', 'createdAt', 'updatedAt'];

export function sanitizeObject<T extends Record<string, SafeAny>>(
  obj: T,
  blacklist: string[],
): Partial<T> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  return Object.keys(obj).reduce((acc, key) => {
    if (blacklist.includes(key)) {
      acc[key] = '[SANITIZED]';
    } else if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !MONGOOSE_KEYS.includes(key)
    ) {
      acc[key] = sanitizeObject(obj[key] as Record<string, SafeAny>, blacklist);
    } else {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as SafeAny);
}
