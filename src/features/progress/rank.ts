export const XP_PER_LEVEL = 250;

/** Level from XP — same formula as record_answer on the server. */
export function levelFor(xp: number): number {
  return Math.floor(Math.max(xp, 0) / XP_PER_LEVEL) + 1;
}

/** Rank titles (kept from the prototype, DESIGN §5.5). */
export function rankFor(level: number): string {
  if (level >= 8) return 'Шеф-Сомельє';
  if (level >= 6) return 'Старший Офіціант';
  if (level >= 4) return 'Профі Офіціант';
  if (level >= 2) return 'Офіціант';
  return 'Стажер ЛІСу';
}
