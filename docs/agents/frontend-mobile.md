# Role brief — Frontend (mobile + shared core)

**You own:** tokens, `src/ui/`, `app/` (router, providers, shell switch), `MobileShell`, all shared hooks/engines/api, and every `views/mobile/*`.
**Tickets:** E0, E1-1…3, E1-5, E2-7…9, E3-1…3, E3-5, E4-1…2, E5-1, E5-2, E5-4, E6-1…2, E8-1, E8-3.
**Read first:** AGENTS.md → DESIGN.md §1–5 → the proposal (mobile tab) → `new_design.pdf`.

## Priorities
1. **Pixel-faithful to the PDF** for menu, detail and flashcards. The proposal extends the same language to games, profile and login.
2. **Speed on the floor.** The menu renders from the persisted cache in < 1s. No spinners on lists (use skeletons). Initial JS ≤ 180 KB gzip (check with `vite build --mode production` + `rollup-plugin-visualizer`).
3. **One-handed use.** Primary actions sit in the lower half of the screen, targets are ≥ 44px, and the bottom nav respects `env(safe-area-inset-bottom)`.

## Porting guide (legacy → new)
The old prototype lives in `src/legacy/` (moved in E0-4, excluded from tsc, ESLint, Tailwind and the build). Delete each file once its pieces are ported.

| Legacy | New home | Notes |
|---|---|---|
| `legacy/App.tsx` tab state | `app/router.tsx` routes | Tabs become URLs |
| `legacy/App.tsx` `healAndMergeItems`, localStorage | delete | The DB is the source of truth |
| `legacy/components/Header.tsx` `getRankLabel`, level formula | `features/profile/rank.ts` | Keep thresholds |
| `legacy/components/FlashcardTab.tsx` touch handlers | `features/flashcards/components/Flashcard.tsx` | Keep the swipe feel, threshold 90px |
| `legacy/components/GameTab.tsx` generators | `features/games/engines/*.ts` | Pure, `rng` injected |
| `legacy/components/GameTab.tsx` `guestScenarios` | DB `guest_scenarios` (seeded) | Client reads from the query |
| `legacy/legacyData.ts` `achievementsList` | DB `achievements` (seeded in `0001_init.sql`) | Only render in the client; unlocking happens server-side |
| `legacy/components/MenuTab.tsx` `getWineTags` | `features/menu/components/WineExtras.tsx` | Restyle with `Tag` |

## Key implementation notes
- `useMediaQuery` must use `useSyncExternalStore` (no flash on the first render). Default to mobile during SSR/tests.
- Keep the category and query in the URL (`useSearchParams`) so back navigation restores the list; also restore scroll with `<ScrollRestoration/>`.
- Flashcard flip: CSS 3D (`preserve-3d`, 450ms). Under reduced motion, use an opacity crossfade.
- Toasts come from the `record_answer` result (`new_achievements`, level change). There is one toast queue in `ui/Toast`.
- Offline: the `onlineManager` from TanStack Query plus `lib/offlineQueue.ts`. Show the banner only after 2s offline to avoid flicker.

## Done looks like
Screens 1–6 of the proposal at 390px match visually. Playwright `mobile` project is green. Lighthouse mobile perf/a11y ≥ 90.
