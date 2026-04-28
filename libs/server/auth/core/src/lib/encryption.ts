import { hash, compare } from 'bcrypt';

export function hashText(input: string, saltRounds = 10): Promise<string> {
  return hash(input, saltRounds);
}

export function compareToHash(
  input: string,
  hashedText: string,
): Promise<boolean> {
  return compare(input, hashedText);
}
