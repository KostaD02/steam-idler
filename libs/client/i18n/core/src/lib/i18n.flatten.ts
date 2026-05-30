import { FlatBundle, NestedBundle } from '@steam-idler/client/i18n/types';

export function flattenBundle(
  source: NestedBundle,
  prefix = '',
  target: FlatBundle = {},
): FlatBundle {
  for (const [key, value] of Object.entries(source)) {
    const dotted = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object') {
      flattenBundle(value, dotted, target);
    } else if (typeof value === 'string') {
      target[dotted] = value;
    }
  }

  return target;
}
