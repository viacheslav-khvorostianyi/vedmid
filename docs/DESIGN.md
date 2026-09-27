# Ведмідь — Design System & Screen Spec

> Source of truth for visuals: `new_design.pdf` (mobile screens 1–3) and the interactive proposal
> https://claude.ai/artifact/HsMvF2sG8wqS3NCFbpGQNc (all mobile + desktop screens).
> If this file and the artifact disagree, the artifact wins for visuals and this file wins for behaviour.

Brand lockup: bear logo + «база знань / ПРОСТО ЛІС». Product (repo/app) name: **Ведмідь**.
UI language: Ukrainian only. All UI copy is lowercase except proper nouns, the brand lockup, and item titles.

---

## 1. Principles
1. **Flat, dark, calm.** A single dark theme: no gradients, glows, blur or bounce animations. Remove the current `bg-[#030a06]` + emerald glow styling completely.
2. **Rush-hour ergonomics.** Waiters check the app mid-service, one-handed. Touch targets ≥ 44px, the primary action sits in the thumb zone, and every item is reachable in ≤ 2 taps from the menu tab.
3. **Mono = content, Sans = controls.** Section titles and item names use JetBrains Mono; chips, buttons and body text use Open Sans.
4. **Active = filled green, inactive = green outline.** This applies to chips, nav, tabs and segmented controls.

## 2. Tokens (`src/styles/tokens.css`)
The snippet below is a summary; `src/styles/tokens.css` is the source of truth (it also holds base styles, the focus ring, reduced-motion rules and the `no-scrollbar` utility). Tailwind classes follow the names: `bg-green`, `border-line-faint`, `text-on-green-strong`, `rounded-ui`, the `desk:` variant.
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Open+Sans:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --color-bg:        #383838; /* app background */
  --color-bg-deep:   #2B2C2B; /* desktop sidebar, drawers */
  --color-bg-raised: #424342; /* inputs, hover rows, stat tiles */
  --color-green:     #476E4C; /* active chip, panels, flashcard, search field */
  --color-green-hi:  #548059; /* section titles, hover on green */
  --color-line:      #5BE35B; /* 1px outlines (chips, cards, bottom nav) */
  --color-line-soft: rgb(91 227 91 / .45); /* dividers */
  --color-text:      #FFFFFF;
  --color-muted:     #9A9A9A; /* inactive chips, captions */
  --color-lockup:    #A8A8A8; /* «ПРОСТО ЛІС» wordmark */
  --color-line-faint: rgb(91 227 91 / .18); /* desktop pane dividers */
  --color-on-green-strong: #1F2A20; /* long text on green (AA) */
  --color-on-green:  #2E2E2E; /* body text on green panels */
  --color-on-green-soft: #A9BFAA; /* secondary text on green */
  --color-search-ph: #8FB293; /* placeholder inside green search */
  --color-warn-bg:   #6E5846; /* «не знаю» */
  --color-warn:      #FFA766;
  --color-danger:    #E5484D; /* form errors only */

  --font-sans: "Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius-ui: 12px;
  --breakpoint-desk: 1024px;
}
body { background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
```
Spacing: 4px base. Side gutter is 16px on mobile and 24px on desktop. Gap between cards is 14px on mobile and 12px in desktop grids.

### Type scale
| Role | Font | Size / weight | Colour |
|---|---|---|---|
| Section title («перші страви») | Mono | 20px / 800 (desktop 22) | green-hi |
| Item title (card, detail) | Mono | 14–16px / 700, lh 1.35 | text (on-green inside flashcard) |
| Brand lockup | Sans 13 / Mono 800 17 | — | text / #A8A8A8 |
| Body, panels | Sans | 13.5–15px / 400 | text or on-green |
| Chips, buttons | Sans | 14–15px / 400–600 | see component |
| Caption / counter | Sans | 12–14px | muted, `tabular-nums` |

### Contrast notes
- `on-green #2E2E2E` on `#476E4C` ≈ 2.9:1, which fails WCAG AA for body text. The PDF uses it anyway. **Decision:** use it only for text ≥ 15px/600 or text that also appears elsewhere. For long panels (склад, фраза для продажу) use `#1F2A20` (≈ 4.6:1). Implement this as `--color-on-green-strong`.
- `muted #9A9A9A` on `#383838` ≈ 4.6:1, which passes.

## 3. Components (`src/ui/`)
| Component | Spec |
|---|---|
| `Logo` | Bear SVG (green `#476E4C`) + lockup. Replace the existing `Sparkles` badge. Needs an asset: `public/bear.svg` (get the vector from the designer; the proposal uses a placeholder) |
| `SearchInput` | Green fill, radius 12, lens icon on the left, placeholder «пошук страви, вина, алергену…». Searches title, ingredients, allergens, anchor, grape varieties. On desktop, `/` focuses it |
| `Chip` | height ≥ 44, padding 11×16, radius 12. `on`: bg green, text white. `off`: 1px line border, muted text. Rows scroll horizontally (`ChipRow`, hidden scrollbar, scroll-snap) |
| `SectionTitle` | Mono 800 green-hi, 1px `line-soft` divider below; the list ends with another divider (as in the PDF) |
| `ItemCard` | 1px line border, radius 12, min-height 112 (mobile) / 96 (desktop), centred mono title. Badges top-right (bestseller ★, finalist) as a small outlined tag. Selected state on desktop: `green/35%` fill |
| `SegmentedTabs` | Row of equal chips. Used in detail (алергени / склад / поєднання; wine adds сорт / виробник) |
| `Panel` | Green fill, radius 12, padding 12×14, on-green text |
| `Photo` | 16:10 (mobile) / 16:9 (desktop) green placeholder with «фото подачі» until `photo_path` exists. `loading="lazy"`, WebP from Supabase Storage transform |
| `Button` | `ok` (green / white), `no` (warn-bg / warn), `ghost` (outline). Height ≥ 48 on mobile |
| `BottomNav` | 4 chips in a grid: меню · картки · ігри · профіль. Divider above, `padding-bottom: env(safe-area-inset-bottom)`. Label «картки» in full (the PDF truncates it only because of mockup width) |
| `Sidebar` (desktop) | 232px, bg-deep, lockup, nav items with key hints 1–4 (M for manager), user block at the bottom |
| `Flashcard` | Green card, 300px (mobile). Front: category (mono, on-green-soft), title (mono, on-green), hint «торкнись для детального ознайомлення». Back: склад / алергени / якір / фраза. 3D flip 450ms; with reduced motion, crossfade instead |
| `Tag` | Pill, 1px line-soft border, 12px. Used for allergens, wine sweetness, grape |
| `StatTile`, `ProgressBar`, `AchievementRow` | See Profile |
| `Toast` | bg-raised, 1px line-soft, radius 12, bottom-center above nav, 3s. Replaces the bouncing crown toast |

Icons: `lucide-react`, stroke 1.6, used sparingly (search, back, lock). No emoji in chrome. Achievement icons may keep their emoji.

## 4. Layout switch
- `< 1024px` → **MobileShell**. Single column, max-width 560px centred (tablets get the phone layout, centred).
- `≥ 1024px` → **DesktopShell**. Sidebar + content panes, min supported width 1024, designed at 1440.
- Chosen once per resize via `useMediaQuery('(min-width: 1024px)')`. Both shells render the same routes.

## 5. Screens

### 5.1 Меню — `/menu`
**Mobile (PDF p.1):** lockup → search → category chips (їжа · вино · коктейлі · пиво · міцні) → for each subcategory: SectionTitle + ItemCards → closing divider → BottomNav.
- Category chip labels map to DB `categories.slug`: `food`, `wine`, `cocktails`, `beer_soft` («пиво», which covers the `Безалкогольні & Пиво` data), `spirits` («міцні»).
- Subcategories render in `subcategories.sort` order, grouped. A sticky mini-header shows the current subcategory while scrolling.
- Search replaces the grouped list with a flat result list across all categories, with the category tag on each card. Empty state: «нічого не знайдено за “{q}”».
- Scroll position and category persist when returning from a detail page.

**Desktop:** three panes: subcategory list with counts (210px) · 2-column item grid · sticky detail pane (400px). Category chips sit in the top bar next to the search. Selecting an item updates the URL (`/menu/:itemId`) without leaving the list. Keys: `/` search, `↑/↓` move selection, `Esc` clears search.

### 5.2 Деталі — `/menu/:itemId`
**Mobile (PDF p.2):** lockup → back link with subcategory title → Photo → title → SegmentedTabs (алергени | склад | поєднання) → Panel with the tab content → «фраза для продажу» Panel (`sales`) → «цікавий факт» Panel (`interesting_fact`, if present).
- Tabs depend on the item (`detailTabs()` in `features/menu/model.ts`):
  - **Food:** `алергени | склад | поєднання`.
  - **Wine:** `сорт | профіль | поєднання`. «сорт» covers grape, sweetness and the description. Wine also gets a «виробник» section (uniqueness / facilities / raw materials).
  - **Cocktails, beer & soft drinks, spirits:** `склад | профіль`.
- The taste profile shows three segments per label (values 0–3).
- A missing field hides its tab. Pairing is the exception for food and wine: it always shows, with the muted line «поєднання ще не заповнене» when empty. The anchor («якір») appears as a muted quote under the title, and bestsellers get the «★ хіт продажів» tag.

**Desktop:** the same content in the right pane, with all sections stacked (no tabs).

### 5.3 Картки — `/cards`
**Mobile (PDF p.3):** category chips (+ «усі») → counter «картка N з M» → Flashcard → «не знаю» | «знаю» → swipe hint. No lockup on this screen (per PDF).
- Tap flips. Swipe right = знаю, swipe left = не знаю (threshold 90px, with card rotation feedback).
- Deck order: due cards first (Leitner, see ARCHITECTURE §Flashcards), then new cards, shuffled with Fisher–Yates.
- End of deck: a summary («знаю 18 · повторити 7») with «ще раз» and «лише помилки».

**Desktop:** question and answer faces side by side (answer blurred until `Space`), buttons below, keys `Space` flip, `←` не знаю, `→` знаю. The right drawer shows Leitner box distribution.

### 5.4 Ігри — `/games`, `/games/:mode`
Modes (from `src/legacy/components/GameTab.tsx`): `quiz` (10 questions, 15s timer, 3 lives), `match` (item ↔ anchor pairs), `recipe` (pick the correct ingredients), `guest` (scenario → best recommendation).
- Mobile: a list of 4 outlined game cards; a game runs full-screen with a top bar (✕, timer, lives/score). Results screen: score, XP earned, «ще раз», «до ігор».
- Desktop: a 2×2 grid; the game renders centred, max-width 720.
- Answer feedback: correct = green fill; wrong = warn-bg fill + correct answer outlined (2px `line`). No confetti. After answering, focus moves to «далі».
- Match: 8 tiles in a 2-column grid; anchor tiles are labelled «якір» and set in italics. A wrong pair flashes both tiles warm and counts as a mistake.
- Recipe: 5 dishes, 8 toggle options each. After checking, correct picks are green, missed ones outlined, extra ones warm.
- On desktop, section shortcuts 1–4 are disabled on game screens so the number keys can pick answers.

### 5.5 Профіль — `/profile`
Avatar initials, name, rank label + level, XP bar to next level, 4 StatTiles (знаю карток, серія зараз, точність у тестах, найдовша серія), achievements list (locked at 45% opacity), «вийти» button.
Desktop: 2 columns. Left: level, tiles, per-category knowledge table. Right: achievements.
Rank labels (keep from `src/legacy/components/Header.tsx`): 1 «Стажер ЛІСу», 2–3 «Офіціант», 4–5 «Профі Офіціант», 6–7 «Старший Офіціант», 8+ «Шеф-Сомельє». Level = `floor(xp/250)+1`.

### 5.6 Вхід — `/login`
Centred bear + lockup, email field «робоча пошта», button «надіслати посилання», success panel «Посилання для входу надіслано на {email}…», footnote «Доступ лише за запрошенням менеджера». Error for an unknown email: «Цієї пошти немає в списку персоналу. Попроси менеджера надіслати запрошення.»

### 5.7 Керування меню — `/manager` (manager role, desktop only)
Top bar: filter, «+ нова позиція», «запросити офіціанта». Table columns: назва · категорія · підкатегорія · фото · активна · оновлено. Clicking a row opens the right drawer with a form covering every item field, allergen tag input, photo upload (≤ 2 MB, jpg/png/webp, converted client-side to WebP ≤ 1600px), «зберегти» / «скасувати». Soft delete = `is_active=false`.
On mobile, the route shows: «Керування меню доступне на комп'ютері.»

## 6. States & motion
- Loading: skeleton cards (bg-raised blocks), never spinners on lists.
- Offline: thin top banner «офлайн — показуємо збережене меню», with actions queued (see ARCHITECTURE).
- Motion: 150–250ms ease-out for chip, tab and pane changes; the flashcard flip is 450ms. Everything respects `prefers-reduced-motion`.

## 7. Accessibility
- `lang="uk"` on `<html>`. Visible 2px `line` focus ring on every interactive element.
- Chips and tabs use `role="tab"`/`aria-selected`; the flashcard is a `button` with `aria-pressed` for its flipped state.
- Swipe always has button equivalents; the timer in `quiz` can be paused (in settings on the profile screen) for accessibility.
- Automated: axe checks in Playwright on every route in both layouts (see `docs/agents/qa.md`).
