# ADR 0001 — Restaurant theme and illustrative stock photos

Status: accepted · 2026-11-26

## Context
The first design (grey `#383838`, neon `#5BE35B` outlines, JetBrains Mono item names) read as a developer tool
rather than as the restaurant «Просто ЛІС». None of the 197 menu items had a photo, so every detail page showed
the «фото подачі» placeholder.

## Decision
**Theme: «dark forest bistro».** We keep a single dark theme (waiters use it in a dim dining room) and the existing
token names, so components did not change. Only the values changed: forest charcoal background, warm cream text,
a moss outline and active state, and brass (`--color-accent`) as a rare accent. Text on green panels is now light,
because dark ink on moss fails WCAG AA. Every text/background pair was checked at ≥ 4.5:1, and outlines at ≥ 3:1.

**Type:** Cormorant Garamond (`--font-display`) for titles and item names, and Manrope (`--font-sans`) for controls.
Both are Google Fonts with Cyrillic. JetBrains Mono stays only for numbers and key hints. Cormorant is light,
so it is used at ≥ 16px and semibold or bold.

**Photos:** until the restaurant shoots its own dishes, items show *illustrative* stock photos:
- Sources: Openverse (Flickr, Wikimedia and others), limited to commercially usable licences
  `cc0, pdm, by, by-sa`. No API key is needed.
- Items of one kind share a photo (all red wines, all blended Scotch). Branded drinks get generic glass shots,
  not label photos.
- Every stock photo carries `menu_items.photo_credit` (`{text, url}`, migration 0002). The UI captions it as
  «ілюстративне фото · author, licence», with a link to the source. This satisfies CC BY attribution and tells
  waiters that the plating is not ours.
- Uploading a real photo (E7-3) must set `photo_credit = null`.
- Files are 800×500 WebP in `public/demo-photos/` (shipped with the demo and uploaded by `npm run db:seed`).
  `scripts/photos/` reproduces them: `queries.ts` (item → key → query), `search.ts` (candidates + contact sheets
  for review), `download.ts` (picked candidates → WebP + `supabase/seed/stockPhotos.ts`).
- `sharp` is a devDependency used only by these scripts. Its install script is denied (`allowScripts`), because
  the prebuilt `@img/sharp-*` binaries need no build.

## Consequences
- The design proposal artifact is out of date for colour and typography. DESIGN.md wins on those until it is refreshed.
- The repo holds a few MB of images. The PWA precache (E8-1) should cache photos at runtime, not precache them.
- Stock photos can mislead about plating. The caption mitigates this; replacing them with real photos is the fix.
