import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.locale('ru');

const RUSSIAN_DATE_FORMATS = [
  'D MMMM YYYY г.',
  'D MMMM YYYY',
];

const ALL_DATE_FORMATS = [
  'YYYY-MM-DD',
  'DD.MM.YYYY',
  ...RUSSIAN_DATE_FORMATS,
];

/**
 * Normalize time value to "HH:mm" format.
 * Accepts "HH:mm", ISO string ("1970-01-01T18:00:00.000Z"), or null/undefined.
 */
export function normalizeTimeToHHmm(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;
  const parsed = dayjs.utc(trimmed);
  if (parsed.isValid()) return parsed.format('HH:mm');
  return '';
}

/** Форматирует дату для отображения: "12 февраля 2025 г." */
export function formatDateForDisplay(dateStr: string): string {
  try {
    const parsed = dayjs(dateStr, ALL_DATE_FORMATS, 'ru', true);
    if (parsed.isValid()) return parsed.locale('ru').format('D MMMM YYYY г.');
    const fallback = dayjs(dateStr);
    if (fallback.isValid()) return fallback.locale('ru').format('D MMMM YYYY г.');
    return dateStr;
  } catch {
    return dateStr;
  }
}

/** Парсит дату и время турнира, возвращает Date или null */
export function parseTournamentDateTime(
  dateStr: string,
  timeStr: string,
): Date | null {
  try {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;

    const dateParsed = dayjs(dateStr, ALL_DATE_FORMATS, 'ru', true);
    if (!dateParsed.isValid()) {
      const fallback = dayjs(dateStr);
      if (!fallback.isValid()) return null;
      return fallback
        .hour(parseInt(timeMatch[1]))
        .minute(parseInt(timeMatch[2]))
        .second(0)
        .toDate();
    }

    return dateParsed
      .hour(parseInt(timeMatch[1]))
      .minute(parseInt(timeMatch[2]))
      .second(0)
      .toDate();
  } catch {
    return null;
  }
}

/** Парсит строку даты (различные форматы) в объект Date */
export function parseTournamentDate(dateStr: string): Date | null {
  try {
    const parsed = dayjs(dateStr, ALL_DATE_FORMATS, 'ru', true);
    if (parsed.isValid()) return parsed.toDate();

    const fallback = dayjs(dateStr);
    return fallback.isValid() ? fallback.toDate() : null;
  } catch {
    return null;
  }
}

/** Форматирует Date в YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/** Форматирует YYYY-MM для API календаря */
export function formatMonth(date: Date): string {
  return dayjs(date).format('YYYY-MM');
}

/** Форматирует YYYY-MM-DD из компонентов */
export function formatLocalDate(
  year: number,
  month: number,
  day: number,
): string {
  return dayjs(new Date(year, month, day)).format('YYYY-MM-DD');
}
