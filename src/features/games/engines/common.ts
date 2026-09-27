import { normalize } from '@/features/menu/model';
import { shuffle } from '@/lib/shuffle';

/** Up to `count` distinct strings from `pool` (normalized comparison), skipping any in `exclude`. */
export function pickDistinct(
  pool: readonly string[],
  count: number,
  exclude: readonly string[],
  rng: () => number,
): string[] {
  const seen = new Set(exclude.map(normalize));
  const out: string[] = [];
  for (const text of shuffle(pool, rng)) {
    const key = normalize(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length === count) break;
  }
  return out;
}
