const FALLBACK_COLORS: Record<string, string> = {
  'Dota 2': '#b83d2d',
  'CS 2': '#cc8844',
  Valorant: '#c85565',
  'Overwatch 2': '#cc8844',
  'League of Legends': '#a0853a',
  PUBG: '#5a7aa5',
  'Mobile Legends': '#5a9a5a',
  MLBB: '#5a9a5a',
  'CS:GO': '#cc8844',
  'Counter-Strike 2': '#cc8844',
};

/**
 * Возвращает цвет дисциплины.
 * Приоритет: dbColor > FALLBACK_COLORS > HSL на основе хеша имени.
 */
export function getDisciplineColor(
  discipline: string,
  dbColor?: string | null,
): string {
  if (dbColor) return dbColor;
  if (FALLBACK_COLORS[discipline]) return FALLBACK_COLORS[discipline];

  let hash = 0;
  for (let i = 0; i < discipline.length; i++) {
    hash = discipline.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 45%, 50%)`;
}
