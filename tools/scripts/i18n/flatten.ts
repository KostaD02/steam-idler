import { FlatBundle, NestedBundle } from './types';

export function flatten(
  source: NestedBundle,
  prefix = '',
  target: FlatBundle = {},
): FlatBundle {
  for (const [key, value] of Object.entries(source)) {
    const dotted = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object') {
      flatten(value, dotted, target);
    } else if (typeof value === 'string') {
      target[dotted] = value;
    }
  }

  return target;
}
