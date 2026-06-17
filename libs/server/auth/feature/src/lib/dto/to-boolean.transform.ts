import { Transform } from 'class-transformer';

export function ToBoolean(): PropertyDecorator {
  return Transform(({ obj, key }) => {
    const raw = (obj as Record<string, unknown>)[key];

    if (typeof raw === 'boolean') {
      return raw;
    }

    if (raw === 'true') {
      return true;
    }

    if (raw === 'false') {
      return false;
    }

    return raw;
  });
}
