const RUSSIAN_MONTHS: Record<string, string> = {
  'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
  'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
  'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
};

const RUSSIAN_MONTHS_NUM: Record<string, number> = {
  'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
  'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
  'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
};

/** Converts Russian date string ("12 февраля 2026 г.") or ISO to YYYY-MM-DD */
export function parseRussianDateToISO(dateStr: string): string | null {
  const russianFormat = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
  if (russianFormat) {
    const day = russianFormat[1].padStart(2, '0');
    const month = RUSSIAN_MONTHS[russianFormat[2].toLowerCase()];
    const year = russianFormat[3];
    if (month) return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return null;
}

/** Parses date string (Russian or ISO) to Date object for sorting */
export function parseDateForSort(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr);
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const month = RUSSIAN_MONTHS_NUM[match[2].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(match[3]), month, parseInt(match[1]));
  }
  return new Date(dateStr);
}
