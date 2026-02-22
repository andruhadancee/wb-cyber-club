import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import 'dayjs/locale/ru.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

const MSK = 'Europe/Moscow';

const RUSSIAN_DATE_FORMATS = [
  'D MMMM YYYY г.',
  'D MMMM YYYY',
];

/** Converts Russian date string ("12 февраля 2026 г.") or ISO to YYYY-MM-DD */
export function parseRussianDateToISO(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = dayjs(trimmed, RUSSIAN_DATE_FORMATS, 'ru', true);
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD');

  return null;
}

/** Parses date string (Russian or ISO) to Date object for sorting */
export function parseDateForSort(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dayjs(dateStr, 'YYYY-MM-DD').toDate();

  const parsed = dayjs(dateStr, RUSSIAN_DATE_FORMATS, 'ru', true);
  if (parsed.isValid()) return parsed.toDate();

  const fallback = dayjs(dateStr);
  return fallback.isValid() ? fallback.toDate() : new Date(dateStr);
}

/**
 * Парсит строку HH:mm в Date для хранения в PostgreSQL TIME.
 * Время трактуется как МСК, хранится в UTC-нейтральном виде (1970-01-01 UTC).
 */
export function parseStartTime(value: string | null | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const parsed = dayjs.utc(`1970-01-01 ${trimmed}`, 'YYYY-MM-DD HH:mm');
  return parsed.isValid() ? parsed.toDate() : null;
}

/** Текущий момент по МСК */
export function nowMSK(): dayjs.Dayjs {
  return dayjs().tz(MSK);
}

/** Сегодняшняя дата по МСК в формате YYYY-MM-DD */
export function todayMSK(): string {
  return nowMSK().format('YYYY-MM-DD');
}
