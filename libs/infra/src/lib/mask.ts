const DEFAULT_VISIBLE_CHARS = 3;
const MASK_CHAR = '*';

export function maskString(
  value: string,
  visible = DEFAULT_VISIBLE_CHARS,
): string {
  if (value.length <= 1) {
    return value;
  }

  const visibleCount = Math.min(visible, Math.ceil(value.length / 3));
  const prefix = value.slice(0, visibleCount);
  const masked = MASK_CHAR.repeat(value.length - visibleCount);

  return `${prefix}${masked}`;
}
