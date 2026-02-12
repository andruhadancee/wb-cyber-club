/** Маппинг дисциплина → путь к иконке */
const DISCIPLINE_ICONS: Record<string, string> = {
  'Dota 2': '/images/pngwing.com 1.png',
  'CHC DOTA 2': '/images/pngwing.com 1.png',
  'CS 2': '/images/Group 29.png',
  'CS:GO': '/images/Group 29.png',
  'Counter-Strike 2': '/images/Group 29.png',
  'Mobile Legends': '/images/mobile_legends_new_logo_update_white_by_newjer53_df45cyq-pre 1.png',
  MLBB: '/images/mobile_legends_new_logo_update_white_by_newjer53_df45cyq-pre 1.png',
  PUBG: '/images/PUBG.png',
  HS: '/images/HS.PNG',
  'Своя игра': '/images/СВОЯ ИГРА.jpg',
  'СВОЯ ИГРА': '/images/СВОЯ ИГРА.jpg',
};

/** Возвращает URL иконки для дисциплины или null */
export function getDisciplineIconUrl(
  discipline: string,
  logoUrl?: string | null,
): string | null {
  if (logoUrl && logoUrl.trim()) return logoUrl.trim();
  return DISCIPLINE_ICONS[discipline] ?? null;
}
