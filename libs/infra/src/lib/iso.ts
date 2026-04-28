import { TZ_OFFSET } from './const';

export function getISOString(date: Date | string = new Date()) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const tzOffsetDate = getTzOffsetDate(date);
  return tzOffsetDate.toISOString();
}

export function getTzOffsetDate(date: Date | string = new Date()) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Date(date.getTime() + TZ_OFFSET);
}
