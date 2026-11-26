// Turns the restaurant's public menu text (lis-resto.choiceqr.com) into menu item fields.
// Pure, so scripts/choiceqr/sync.ts and the tests share it.

export type ParseKind = 'wine' | 'other';

export interface ParsedDescription {
  ingredients?: string;
  pairing?: string;
  grapeVarieties?: string;
  sweetness?: string;
}

/** Collapses the double spaces and stray spaces before punctuation the menu editor leaves behind. */
export function tidy(text: string): string {
  return text
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=[A-Za-zА-Яа-яІіЇїЄєҐґ])/g, '$1 ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** One paragraph: «Аромат:\nЯскравий» → «Аромат: Яскравий», lines joined with spaces. */
function paragraph(lines: string[]): string {
  return tidy(lines.join('\n')).replace(/:\n/g, ': ').replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim();
}

// «Сухе біле вино, сорт винограду - Мускат Голодриги.»
const SWEETNESS = /^(сухе|напівсухе|напівсолодке|солодке|брют|екстра)/i;
const WINE_LINE =
  /^(\S+)\s+(?:біле|червоне|рожеве|ігристе|оранж)?[^,]*вино(?:,\s*сорт(?:и)? винограду\s*[-–—:]\s*(.+?))?\.?$/i;

export function parseDescription(raw: string, kind: ParseKind): ParsedDescription {
  const text = tidy(raw);
  if (!text) return {};
  const out: ParsedDescription = {};

  // «🍷Ярило\nВиноробня Янчинські пагорби» — the wine the kitchen pairs with the dish
  const [body, ...pairs] = text.split('🍷');
  if (pairs.length) {
    out.pairing = pairs
      .map((p) => {
        const [name, ...rest] = tidy(p).split('\n');
        return rest.length ? `${name} (${rest.join(', ')})` : name;
      })
      .join('; ');
  }

  let lines = body.split('\n').filter(Boolean);
  if (kind === 'wine') {
    // the producer lives in `producer`; `\b` does not work with Cyrillic, hence (\s|$)
    lines = lines.filter((l) => !/^виноробня(\s|$)/i.test(l));
    const wineLine = lines.findIndex((l) => WINE_LINE.test(l));
    if (wineLine >= 0) {
      const [, sweetness, grapes] = WINE_LINE.exec(lines[wineLine])!;
      if (SWEETNESS.test(sweetness)) out.sweetness = sweetness.toLowerCase();
      // «Леанка, один із традиційних сортів…»: a grape list followed by prose keeps the prose in the text
      const short = grapes && grapes.length <= 40 ? grapes.trim() : grapes?.split(',')[0].trim();
      if (short) out.grapeVarieties = short;
      if (out.sweetness || out.grapeVarieties) {
        if (grapes && short !== grapes.trim()) lines[wineLine] = grapes.trim();
        else lines.splice(wineLine, 1);
      }
    }
    // «Біле ігристе вино.» / «Брют» / «Сорти винограду - Піно Грі, Аліготе» on separate lines
    lines = lines.filter((l) => {
      const grapes = /^сорт(?:и)? винограду\s*[-–—:]\s*(.+?)\.?$/i.exec(l)?.[1];
      if (grapes && !out.grapeVarieties && grapes.length <= 40) {
        out.grapeVarieties = grapes;
        return false;
      }
      if (!out.sweetness && SWEETNESS.test(l) && /^\S+\.?$/.test(l)) {
        out.sweetness = l.replace('.', '').toLowerCase();
        return false;
      }
      return true;
    });
  }
  const ingredients = paragraph(lines);
  if (ingredients) out.ingredients = ingredients;
  return out;
}

/** Menu titles as the site shows them, minus doubled spaces. */
export function cleanTitle(name: string): string {
  return tidy(name);
}

/**
 * The site's text wins, with two exceptions for a dish that did not change:
 * - a blurb shorter than the current composition («Освіжаючий лимонад власного приготування») does not replace it;
 * - a coffee bean card («Зерно: Руанда Гітокі…») is added after the composition, not instead of it.
 * A renamed dish always takes the site's text.
 */
export function pickIngredients(current: string, fromSite: string | undefined, renamed: boolean): string {
  if (!fromSite || fromSite === current) return current;
  if (renamed) return fromSite;
  if (/^зерно\s*:/i.test(fromSite)) return `${current} ${fromSite}`;
  return fromSite.length < current.length * 0.8 ? current : fromSite;
}

const STOP = new Set(['та', 'з', 'із', 'зі', 'і', 'й', 'в', 'у', 'на', 'по']);
const stems = (title: string) =>
  new Set(
    title
      .toLowerCase()
      .replace(/\(.*?\)/g, ' ')
      .replace(/['’ʼ`]/g, '')
      .split(/[^a-zа-яіїєґ0-9]+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
      .map((w) => w.slice(0, 5)),
  );

/** True when the dish itself changed, not just the word order («Малиновий лимонад» = «Лимонад Малина»). */
export function isRenamed(before: string, after: string): boolean {
  const a = stems(before);
  const b = stems(after);
  return a.size !== b.size || [...a].some((w) => !b.has(w));
}
