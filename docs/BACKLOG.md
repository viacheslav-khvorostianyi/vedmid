# Ведмідь — Implementation Backlog

Work top to bottom. Each ticket is one PR. IDs are stable; reference them in branch names (`feat/E3-2-menu-list-mobile`) and commits.
Global Definition of Done lives in [AGENTS.md](../AGENTS.md#definition-of-done). The `Owner` column refers to the role briefs in [docs/agents/](agents/).

Legend: **FM** frontend-mobile · **FD** frontend-desktop · **BE** backend-supabase · **QA** qa

---

## E0 · Cleanup & foundation (Phase 1) — ✅ done 2026-09-27
E0-4 is done in its interim form: the legacy code sits in `src/legacy/` until E3–E6 port it, and deleting that folder is the last step of E6.
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E0-1 | Remove dead dependencies and AI Studio leftovers | FM | `@google/genai`, `express`, `@types/express`, `dotenv` removed. `metadata.json` deleted. `vite.config.ts` has no DISABLE_HMR block. `index.html` has `lang="uk"` and `<title>Ведмідь</title>`. `package.json` name is `vedmid`. `npm run build` passes |
| E0-2 | Tooling | FM | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier. `npm run lint` = `tsc --noEmit && eslint .`. Vitest + RTL + jsdom set up with one sample test. Playwright set up with projects `mobile` (Pixel 7) and `desktop` (1440×900) |
| E0-3 | Folder skeleton + router | FM | Structure from ARCHITECTURE §4.2 created. `react-router` v7 with all routes from §4.2 rendering placeholder views. `LayoutSwitch` + `useMediaQuery` pick `MobileShell`/`DesktopShell` (both `React.lazy`). Resizing across 1024px swaps the shell without losing the route |
| E0-4 | Delete removed features | FM | `MenuTab.tsx`, `FlashcardTab.tsx`, `GameTab.tsx`, `Header.tsx`, `StatsDashboard.tsx`, `utils/menuParser.ts`, `healAndMergeItems` and the localStorage keys `custom_restaurant_menu`/`lis_waiter_stats_v2` are removed from the runtime (**after** E3–E6 have ported the pieces listed in ARCHITECTURE "Code to reuse"; until then, move them to `src/legacy/` and exclude them from the build). `src/data/*.ts` stays (seed source) |
| E0-5 | Fix domain types | FM | `src/types.ts` split: `features/menu/types.ts` (`MenuItem` in the DB-mapped shape), `features/profile/types.ts` (`PlayerStats` = `{xp, level, streak, maxStreak, correctAnswers, totalAnswers}`). No `any` in public signatures |

## E1 · Design system & shells (Phase 1) — ✅ done 2026-09-27
Still open: E1-4's `M` shortcut and the sidebar user block need the signed-in role and profile (E2-7), and E1-5 still uses the placeholder bear (regenerate icons with `node scripts/generate-icons.mjs` when the vector arrives).
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E1-1 | Tokens | FM | `src/styles/tokens.css` exactly as DESIGN §2. The old `index.css` theme, glows and `#030a06` are gone. Fonts: JetBrains Mono + Open Sans with fallbacks |
| E1-2 | UI kit primitives | FM | `Logo, SearchInput, Chip, ChipRow, SectionTitle, ItemCard, SegmentedTabs, Panel, Photo, Button, Tag, StatTile, ProgressBar, Toast, Skeleton` in `src/ui/`, each with a Vitest render test covering its states (on/off, disabled, focus). Touch targets ≥ 44px. `/dev/ui` route (dev only) shows all of them |
| E1-3 | MobileShell | FM | Lockup header where DESIGN requires it, `BottomNav` (меню · картки · ігри · профіль) fixed with safe-area padding, active tab from route. Content max-width 560px centred |
| E1-4 | DesktopShell | FD | 232px `Sidebar` with lockup, nav, key hints, user block. Keys `1–4` navigate, `M` opens manager (manager only). Top bar slot for search/chips. Matches the proposal D1–D4 |
| E1-5 | Bear logo asset | FM | `public/bear.svg` + PWA icons (192, 512, maskable) from the designer's vector. Placeholder SVG from the proposal is allowed until it arrives |

## E2 · Supabase, auth, data (Phase 2) — ✅ code done 2026-09-27
Still open:
- **E2-1 cloud part** (projects, Auth settings, SMTP, secrets) needs an account. Follow [runbooks/supabase-setup.md](runbooks/supabase-setup.md).
- **DB tests** run in PGlite with a Supabase shim (`supabase/tests/`, part of `npm test`), not pgTAP. They exercise the real migration SQL, RLS and RPCs without Docker. Run `supabase db lint` and a manual smoke test on the first real `db reset`.
- **`src/lib/db.types.ts`** is hand-written in the generator's format. Replace it with `npm run db:types` once a database is up.
- **Bundle budget:** the initial JS is 167 KB gzip out of 180 (feature views are lazy per route since E3; the rest is React, the router, supabase-js and TanStack Query). If it grows past the budget, swap supabase-js (which always bundles an unused Realtime client) for `@supabase/auth-js` + `@supabase/postgrest-js`.
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E2-1 | Supabase projects & CLI | BE | `supabase init`, local stack runs (`supabase start`). Projects `vedmid-dev` and `vedmid-prod` created in eu-central-1. Auth: email provider on, **signups disabled**, magic link + OTP, redirect URLs set, custom SMTP (Resend) configured on prod |
| E2-2 | Apply schema | BE | `supabase/migrations/0001_init.sql` applies cleanly on `supabase db reset`. `supabase db lint` has no errors. Types generated into `src/lib/db.types.ts` (`npm run db:types`) |
| E2-3 | Seed script | BE | `supabase/seed.ts` (run with `tsx`, `npm run db:seed`) upserts subcategories, all 197 menu items (by `legacy_id`) and 5 guest scenarios from `src/legacy/components/GameTab.tsx`. It is idempotent: a second run changes 0 rows. Row counts match: food 59, wine 37, cocktails 31, beer_soft 43, spirits 27 |
| E2-4 | RLS tests | BE | pgTAP tests in `supabase/tests/`: a waiter cannot insert/update `menu_items`, cannot read another user's `card_progress`, cannot update `player_stats` directly, cannot call `set_role`; a manager can do all menu writes; anon can read nothing. Run in CI via `supabase test db` |
| E2-5 | RPC tests | BE | pgTAP: `record_answer` awards XP per the table, resets streak on a wrong answer, moves the Leitner box (1→2…5, wrong→1), unlocks `ach-1` at 100 XP and adds its bonus, and awards 0 XP after 120 answers in 10 min |
| E2-6 | `invite-staff` Edge Function | BE | POST `{email, display_name}`. Rejects if the caller is not a manager (checks JWT + `is_manager`). Calls `auth.admin.inviteUserByEmail` with `data.display_name`. Returns 200/400/403 with a JSON error. The service-role key lives only in function secrets |
| E2-7 | Client data layer | FM | `lib/supabase.ts` (typed client), `lib/queryClient.ts` with the IndexedDB persister (maxAge 7d). `AuthProvider` exposes `{session, profile, role, signOut}`. `RequireAuth`/`RequireRole` guards |
| E2-8 | Login screen | FM | `/login` per DESIGN §5.6. Sends a magic link with `shouldCreateUser: false`. Shows success panel and error copy. Handles the OTP code as a fallback. After login, redirects to the originally requested route. Works in both shells (one responsive view) |
| E2-9 | Offline answer queue | FM | `lib/offlineQueue.ts` stores failed `record_answer` calls in IndexedDB and flushes them FIFO on `online`/focus. Unit tested with fake IndexedDB. The UI shows the offline banner (DESIGN §6) |

## E3 · Menu (Phase 2) — ✅ done 2026-09-27
Notes:
- **Detail tabs** follow the data: food shows алергени/склад/поєднання, wine shows сорт/профіль/поєднання, other drinks show склад/профіль. Pairing is shown for food and wine even when empty, so managers notice gaps; see `detailTabs()` and DESIGN §5.2.
- **Photos** use Supabase image transforms only when `VITE_SUPABASE_IMAGE_TRANSFORMS=true` (they need a paid plan). Otherwise the uploaded file (≤1600px WebP, E7-3) is served directly.
- **Two bugs found in e2e and fixed:** the chip row's `scrollIntoView` also scrolled the page, which broke scroll restoration; and the URL-driven search box dropped keystrokes when typing fast (fixed with `flushSync` on the search-param updates).
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E3-1 | Menu hooks | FM | `useMenu()` (grouped by category → subcategory, sorted), `useItem(id)`, `useMenuSearch(q)` (normalised: case, apostrophes ʼ’', ё/є not folded) over title, ingredients, allergens, anchor, grape. Unit tests: «борщ» finds the borscht, «лактоза» finds all items with lactose, empty query returns grouped |
| E3-2 | Menu list — mobile | FM | Matches PDF p.1. Chips їжа · вино · коктейлі · пиво · міцні (scrollable), category in `?c=`. Grouped sections with dividers. Sticky subcategory label. Search in `?q=` gives flat results with category tags. Skeleton while loading. Scroll restored on back |
| E3-3 | Item detail — mobile | FM | Matches PDF p.2. Photo (placeholder if none), title, SegmentedTabs алергени / склад / поєднання; wine variant (сорт і солодкість, профіль, виробник). «фраза для продажу», «цікавий факт». Tabs hide when the field is empty; pairing empty state. «оновлено {date}» footnote |
| E3-4 | Menu panes — desktop | FD | 3 panes per proposal D1. `/menu/:itemId` selects in place. `/` focuses search, `↑/↓` move selection, `Enter` opens, `Esc` clears. Detail sections stacked. Reuses `ItemDetailContent` from E3-3 |
| E3-5 | Photos | FM | `Photo` loads `photo_path` from Storage with the transform (`width=800`, `format=webp`), lazy, with a fixed aspect ratio (no CLS) |

## E4 · Flashcards (Phase 2) — ✅ done 2026-09-27
Notes:
- **Shared answer path:** answers go through `useRecordAnswer()` in the shared `features/progress` module, which also handles stats, achievements, ranks and toasts. Games (E5) and Profile (E6) reuse it.
- **Deck:** fixed for the whole run. «ще раз» reshuffles the same cards; «лише помилки» keeps only the misses. When nothing is due, «повторити все одно» practises every card.
- **Coverage gate:** `leitner.ts` and `session.ts` must stay at 100%. `npm run test:coverage` enforces it.
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E4-1 | Leitner engine | FM | `features/flashcards/leitner.ts`: `buildDeck(items, progress, now)` puts due cards first (oldest), then unseen, shuffled with Fisher–Yates (`lib/shuffle.ts`, seedable for tests); `nextBox(box, known)`. 100% branch coverage |
| E4-2 | Cards — mobile | FM | Matches PDF p.3. Chips (+ «усі»), counter «картка N з M», flip on tap/Enter, swipe ±90px with rotation, buttons «не знаю» / «знаю» call `record_answer('card')`. End-of-deck summary with «ще раз» / «лише помилки». XP/achievement toasts |
| E4-3 | Cards — desktop | FD | Side-by-side faces, answer hidden until `Space`, `←`/`→` answer. Leitner box distribution drawer (proposal D2) |

| E4-4 | Don't advance boxes on early repeats | BE | `record_answer` moves a card up a box only if it was due (`reviewed_at + interval[box] <= now()`); early repeats (e.g. «ще раз» in the same session) still count for XP and streak but leave the box alone. pgTAP/PGlite test for both cases. The client `applyAnswer` mirrors this |

## E5 · Games (Phase 3) — ✅ done 2026-09-27
Notes:
- **Legacy bugs not carried over:** biased shuffles; invented quiz answers (distractors now come from other categories when one is short); duplicate options; recipe ingredients split inside parentheses. Client-side bonus XP for finishing a game is gone, since XP is only awarded per answer on the server.
- **Match game:** wrong pairs are recorded as wrong answers (they reset the streak). The prototype ignored them.
- **Recipe game:** now 5 rounds (the prototype had one), so there is a score.
- **Guest game:** one tap answers. The prototype had a separate confirm step.
- **Keyboard conflict fixed:** desktop section shortcuts (1–4) are off on game screens (route handle `noSectionHotkeys`), because the quiz and guest games use 1–4 for answers.
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E5-1 | Extract engines | FM | `engines/quiz.ts`, `match.ts`, `recipe.ts`, `guest.ts` hold the pure logic ported from `src/legacy/components/GameTab.tsx` (question generation, scoring, timer/lives rules). Unit tests per engine; no React imports |
| E5-2 | Games list + runner — mobile | FM | 4 outlined game cards → `/games/:mode` full-screen runner with top bar (✕, timer, lives/score), answer feedback per DESIGN §5.4, results screen. Every answer calls `record_answer`; finishing calls `finish_game` |
| E5-3 | Games — desktop | FD | 2×2 grid; runner centred at max 720px; number keys `1–4` pick answers in quiz/guest |
| E5-4 | Guest scenarios from DB | FM | `guest` mode reads `guest_scenarios`; none are hard-coded in the client |

## E6 · Profile (Phase 3)
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E6-1 | Stats hooks | FM | `useStats()` (player_stats + level + rank from `rank.ts`), `useAchievements()` (all + unlocked), `useCategoryKnowledge()` (share of items in box ≥ 3 per category). Rank thresholds per DESIGN §5.5, unit tested |
| E6-2 | Profile — mobile | FM | Per proposal screen 5. «вийти» signs out and clears the query cache |
| E6-3 | Profile — desktop | FD | Per proposal D3: 2 columns, per-category table |

## E7 · Manager (Phase 3)
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E7-1 | Manager table | FD | `/manager` (RequireRole manager). Mobile shows the DesktopOnly message. Table with filter, category filter, sort by updated. Includes inactive items (muted) |
| E7-2 | Item drawer | FD | Form for every `menu_items` field (zod schema shared with the seed), allergen tag input with suggestions from existing values, subcategory select + «нова підкатегорія». Save → upsert → invalidate `['menu']` → toast «Збережено». Validation errors inline. Soft delete via the «активна» toggle |
| E7-3 | Photo upload | FD | File input (jpg/png/webp ≤ 2 MB), client-side resize to ≤ 1600px WebP (canvas), upload to `dish-photos/{item_id}/{uuid}.webp`, update `photo_path`, delete the previous object |
| E7-4 | Staff management | FD | List of profiles with role select (`set_role`) and «запросити офіціанта» dialog → `invite-staff` function. Errors are shown in plain Ukrainian |

## E8 · Production readiness (Phase 4)
| ID | Ticket | Owner | Acceptance criteria |
|---|---|---|---|
| E8-1 | PWA | FM | `vite-plugin-pwa` per ARCHITECTURE §4.8. Installable on Android/iOS. Offline: the menu and cached photos open with the network off |
| E8-2 | CI/CD — ✅ CI, Pages demo and the gated production workflow are done (2026-09-27); production turns on via the runbook | BE | `.github/workflows/ci.yml` per §4.9, with a migration deploy on main. Vercel project with SPA rewrite and security headers (`vercel.json`) |
| E8-3 | Observability | FM | Sentry (errors, release = SHA, PII scrubbed), Vercel Analytics |
| E8-4 | Backups | BE | Supabase Pro backups enabled or a weekly `pg_dump` workflow; restore tested once on dev |
| E8-5 | E2E + a11y suite | QA | Playwright specs per [qa.md](agents/qa.md) pass in both projects; axe finds no serious/critical issues; Lighthouse mobile ≥ 90 perf & a11y on `/menu` |
| E8-6 | Data review & pilot | BE | The chef signs off on the allergens for all 59 food items (checklist exported from DB). 5 waiters invited, 1-week pilot, feedback triaged |

## Extras
| ID | Ticket | Status |
|---|---|---|
| X-1 | **Demo mode** (`npm run demo`, `npm run demo:build`): the real app on an in-browser fake backend (MSW), with a role switch and reset. Lets people try the app before Supabase exists | ✅ done 2026-09-27 |
| X-2 | Fixes from the first manual run: the «★ хіт» badge no longer covers long card titles; «Не вказано»-style placeholders in the seed data are stored as not set | ✅ done 2026-09-27 |

## Later (explicitly out of v1)
Wine advisor, gastro constructor, steak guide, summary table, .txt import, leaderboard, manager insights dashboard, multi-restaurant tenancy, English UI.
