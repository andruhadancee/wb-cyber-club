const RUSSIAN_MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/**
 * Normalize time value to "HH:mm" format.
 * Accepts "HH:mm", ISO string ("1970-01-01T18:00:00.000Z"), or null/undefined.
 */
export function normalizeTimeToHHmm(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;
  // ISO date string — extract HH:mm in UTC
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  return '';
}

/** Форматирует дату для отображения: "12 февраля 2025 г." */
export function formatDateForDisplay(dateStr: string): string {
  try {
    if (dateStr.match(/\d+\s+\w+\s+\d+/)) return dateStr;

    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (parts) {
      const [, year, month, day] = parts;
      return `${parseInt(day)} ${MONTH_NAMES[parseInt(month) - 1]} ${year} г.`;
    }

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
    let day: number, month: number, year: number;

    const dotsFormat = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    const dashesFormat = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const russianFormat = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);

    if (dotsFormat) {
      day = parseInt(dotsFormat[1]);
      month = parseInt(dotsFormat[2]) - 1;
      year = parseInt(dotsFormat[3]);
    } else if (dashesFormat) {
      year = parseInt(dashesFormat[1]);
      month = parseInt(dashesFormat[2]) - 1;
      day = parseInt(dashesFormat[3]);
    } else if (russianFormat) {
      day = parseInt(russianFormat[1]);
      month = RUSSIAN_MONTHS[russianFormat[2].toLowerCase()];
      year = parseInt(russianFormat[3]);
    } else {
      return null;
    }

    if (month === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);

    return new Date(year, month, day, hours, minutes, 0);
  } catch {
    return null;
  }
}

/** Парсит строку даты (различные форматы) в объект Date */
export function parseTournamentDate(dateStr: string): Date | null {
  try {
    let day: number, month: number, year: number;

    const dots = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    const dashes = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const rus = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/i);

    if (dots) {
      day = parseInt(dots[1]);
      month = parseInt(dots[2]) - 1;
      year = parseInt(dots[3]);
    } else if (dashes) {
      year = parseInt(dashes[1]);
      month = parseInt(dashes[2]) - 1;
      day = parseInt(dashes[3]);
    } else if (rus) {
      day = parseInt(rus[1]);
      month = RUSSIAN_MONTHS[rus[2].toLowerCase()];
      year = parseInt(rus[3]);
    } else {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    }

    if (month === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }
    return new Date(year, month, day);
  } catch {
    return null;
  }
}

/** Форматирует Date в YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Форматирует YYYY-MM для API календаря */
export function formatMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Форматирует YYYY-MM-DD из компонентов */
export function formatLocalDate(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
