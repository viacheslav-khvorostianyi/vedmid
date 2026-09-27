# AGENTS.md — Ведмідь

Instructions for AI coding agents and human developers working in this repo. Read this first, then the doc for your task.

**What this is:** «Ведмідь» is an internal knowledge base and training app for the waiters of the restaurant «Просто ЛІС» (menu lookup, flashcards, games, profile). It ships as a mobile-first PWA with a separate desktop layout, backed by Supabase.

| Doc | Use it for |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech spec: routes, data flow, API/RPC, security, deployment |
| [docs/DESIGN.md](docs/DESIGN.md) + [design proposal](https://claude.ai/artifact/HsMvF2sG8wqS3NCFbpGQNc) | Tokens, components, every screen in both layouts |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Ordered tickets with acceptance criteria. Pick the next unblocked one |
| [supabase/migrations/](supabase/migrations/) | DB schema, RLS and RPCs (source of truth) |
| [docs/agents/](docs/agents/) | Role briefs: `frontend-mobile`, `frontend-desktop`, `backend-supabase`, `qa` |
| `new_design.pdf` | Original mobile mockups (menu, detail, flashcard) |

## Stack
React 19 · TypeScript 5.8 (strict) · Vite 6 · Tailwind CSS 4 (`@theme` tokens) · react-router 7 · TanStack Query 5 · supabase-js 2 · motion · lucide-react · zod · Vitest + Testing Library · Playwright · vite-plugin-pwa.
**Do not add** state libraries (Redux, Zustand), UI kits (MUI, shadcn), CSS-in-JS, or AI SDKs without an ADR in `docs/adr/`.

## Commands
```bash
npm install
npm run dev            # http://localhost:3000 (needs Supabase, see the runbook)
npm run demo           # same app with an in-browser fake backend, no setup (src/demo)
npm run lint           # tsc --noEmit && eslint .
npm run test           # vitest run (unit + DB tests)
npm run test:coverage  # with coverage; pure engines have 100% thresholds
npm run test:e2e       # playwright test (projects: mobile, desktop); first run: npx playwright install chromium
npm run test:demo      # build the demo for /vedmid/ and smoke-test it (as deployed to Pages)
npm run format         # prettier --write .
npm run build          # vite build
supabase start         # local Postgres/Auth/Storage (Docker)
npm run db:start       # supabase start (needs Docker) — see docs/runbooks/supabase-setup.md
npm run db:reset       # supabase db reset (applies migrations)
npm run db:seed        # tsx supabase/seed.ts (needs .env.seed); --dry-run validates only, --overwrite resets edited rows
npm run db:types       # supabase gen types typescript --local > src/lib/db.types.ts
```
Env (`.env.local`, never committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_SENTRY_DSN`.

## Repository layout
```
src/
  app/        App.tsx (shell switch), router.tsx, providers, route guards
  shells/     mobile/MobileShell.tsx · desktop/DesktopShell.tsx
  features/   menu · flashcards · games · profile · manager · auth
              └─ each: api.ts, hooks/, components/, views/mobile/, views/desktop/, (engines/ | *.ts pure logic)
  ui/         design-system primitives (no data fetching, no feature imports)
  lib/        supabase client, query client, offline queue, useMediaQuery, shuffle, db.types.ts
  styles/     tokens.css
  data/       legacy static menu (SeedMenuItem) — seed source only, never imported by app code (ESLint-enforced)
  legacy/     old prototype kept for porting — excluded from tsc, ESLint, Tailwind and the build
  test/       Vitest setup + matchMedia fake (setViewportWidth)
e2e/          Playwright specs (run in mobile + desktop projects)
supabase/     migrations/, seed.ts, tests/ (pgTAP), functions/invite-staff/
docs/         ARCHITECTURE, DESIGN, BACKLOG, agents/, adr/
```

## Architecture rules (enforced in review)
1. **Two layouts, one core.** Anything used by both layouts (fetching, logic, formatting, validation) lives in `features/*/hooks`, `features/*/engines`, `features/*/api.ts` or `lib/`. Files under `views/mobile` and `views/desktop` only compose UI. If you copy logic between the two view folders, move it into a hook instead.
2. The layout is chosen **only** in `app/` via `useMediaQuery('(min-width: 1024px)')`. No `window.innerWidth` checks or `hidden lg:block` layout forks inside features. Tailwind responsive classes are fine for minor spacing inside a view.
3. **Dependency direction:** `views → components/hooks → api/engines → lib`. `ui/` imports nothing from `features/`. Features don't import each other, with three exceptions: any feature may use `auth` (session) and `progress` (stats, achievements, `useRecordAnswer`); `flashcards` and `games` may read `menu` data; `profile` may read `flashcards` progress hooks.
4. **Server state = TanStack Query.** Query keys: `['menu']`, `['item', id]`, `['progress']`, `['stats']`, `['achievements']`, `['guest-scenarios']`, `['staff']`. Mutations invalidate the narrowest key.
5. **The client never writes XP, streaks, achievements or card progress directly.** Use `rpc('record_answer')` and `rpc('finish_game')`. Menu writes happen only in `features/manager`.
6. **RLS on every table.** Every new table ships in a migration with RLS enabled plus policies and a pgTAP test. Never use or expose the service-role key in `src/`.
7. **Pure engines.** Game and Leitner logic are pure TS functions with injected randomness/time (`rng`, `now`). They must be unit-tested.
8. Use **Fisher–Yates** (`lib/shuffle.ts`) for any shuffling. `sort(() => Math.random() - 0.5)` is forbidden.

## Shell & UI conventions (from E1)
- Route options for the shells go in the route `handle` (`ShellHandle` in `src/app/navigation.ts`), e.g. `handle: { lockup: true }` shows the brand lockup on mobile.
- Desktop views wrap their content in `shells/desktop/DesktopPage` (`topBar` + body). The desktop `main` does not scroll, so each pane scrolls on its own.
- Keyboard shortcuts use `useHotkeys` from `src/lib/useHotkeys.ts`, bound by `KeyboardEvent.code` (`Digit1`, `KeyM`, `Slash`) so they work on the Ukrainian layout.
- Single-select chip rows use `ui/ChipRow`, and detail tabs use `ui/SegmentedTabs`. Both are ARIA tabs with arrow-key navigation. Nav links styled as chips use `chipClass()`.
- Toasts come from `useToast()` (`ui/Toast`). Shells set `--toast-offset` so toasts clear the bottom nav.
- Run `npm run dev` and open `/dev/ui` to see every primitive (dev builds only).

## Menu conventions (from E3)
- Menu data comes from `useMenu()`, `useMenuSections()`, `useItem()` and `useMenuSearch()` (`features/menu/hooks/useMenu.ts`), all backed by the single cached `['menu']` query. Pure logic (grouping, search, detail tabs) lives in `features/menu/model.ts`.
- List state lives in the URL (`?c=&q=&s=`) via `useMenuParams()`. Updates use `replace` and `flushSync`, because the search box is controlled by the URL.
- Route views are `React.lazy` in `src/app/router.tsx`. Each shell wraps its `<Outlet/>` in `Suspense`.
- Tests: `src/test/menuFixture.ts` gives the real 197-item menu (`MENU`, `MENU_ROWS`, ids like `item-soup-1`). `renderRoute()` pre-caches it, and the e2e fixtures serve the same rows.

## Progress & flashcards conventions (from E4)
- Record every answer with `useRecordAnswer()` (`features/progress/hooks.ts`). It calls the `record_answer` RPC (queued offline), updates the `['stats', userId]` cache, and toasts achievements and level-ups. Never compute XP on the client.
- Flashcard progress is cached under `['progress', userId]`. `useAnswerCard()` updates it optimistically with `applyAnswer()` (`leitner.ts`) before recording.
- The session deck is fixed when the session mounts. Rebuild it by changing the session's React `key` (filter change, practise-all).

## Games conventions (from E5)
- Game logic lives in pure engines (`features/games/engines/*.ts`, 100% coverage) with injected `rng`. Components hold one `useReducer` per game, and «ще раз» remounts the game with a new `key`.
- Record answers in event handlers, not effects, so StrictMode can't double-count. The exception is a quiz timeout, which comes from the reducer and is recorded once per question from state. `useGameRecording` saves `finish_game` once when the game ends.
- Route handles: `hideNav` (mobile full-screen) and `noSectionHotkeys` (the page uses 1–4 itself). Both are set on `/games/:mode`.

## CI/CD (GitHub Actions)
- **`ci.yml`** runs on every PR and push to `main`. Job `checks`: lint, `format:check`, `test:coverage` (unit + DB tests + coverage gate), seed dry-run, build. Job `e2e`: Playwright on Android (Chromium), iPhone (WebKit) and desktop. `main` is protected: both jobs must pass, and there is no force-push.
- **`demo-pages.yml`** runs after green CI on `main`. It builds the demo for `/vedmid/`, runs `npm run test:demo` (a smoke test of the built demo), deploys to GitHub Pages, then runs `npm run test:demo:live` against the live https site. Safari's mixed-content blocking only shows up there, so any URL the demo calls must be https.
- **`deploy-production.yml`** is skipped until the repo variable `PRODUCTION_ENABLED=true` and the secrets exist. It pushes Supabase migrations and the Edge Function, then deploys to Vercel (`vercel.json` holds the SPA rewrite and security headers).
- Workflow: branch from `main`, open a PR, merge once green (squash). Use Conventional Commits with the ticket ID.
- The app must work under a base path (`import.meta.env.BASE_URL`, `/vedmid/` on Pages). Use router links, or build URLs with `BASE_URL`; never hard-code `/…` in `window.location`.

## Demo mode
- `npm run demo` (Vite mode `demo`) serves `/mockServiceWorker.js`. `src/main.tsx` starts `src/demo/startDemo.ts` before rendering. `import.meta.env.VITE_DEMO` is a build-time literal, so normal builds drop all of it.
- `src/demo/handlers.ts` answers every Supabase endpoint the app uses. When you add a table query or RPC, add a handler; unknown requests get a 501 that names the endpoint.
- `src/demo/server.ts` mirrors `record_answer` / `finish_game`. When you change those SQL functions, change this too; `server.test.ts` and `handlers.test.ts` cover it.
- The seed data (`supabase/seed/`: fixture rows, guest rows, `achievements.ts`) is shared by the unit tests, the e2e fixtures and the demo. `seed.test.ts` checks `achievements.ts` against the migration.

## Data & auth conventions (from E2)
- `useAuth()` (`features/auth/context.ts`) returns `{ status, session, profile, signOut }`. Protected routes sit under `RequireAuth`; role-gated ones are wrapped in `<RequireRole allow="manager">`.
- Progress RPCs go through `callOrQueue()` from `src/lib/rpc.ts`. Offline or on a transient failure it queues the call in IndexedDB, and `useOfflineSync` flushes the queue in FIFO order when the connection returns.
- **Tests:** render routes with `renderRoute(path, signedIn('manager'))` from `src/test/renderRoute.tsx` (no network). E2E specs use the `asWaiter` / `asManager` / `signedOut` fixtures from `e2e/fixtures.ts`, which seed a fake session and mock Supabase HTTP.
- DB tests (`supabase/tests`) run the real migrations in PGlite. Every new table, policy or RPC gets a test there.

## Design rules
- Use tokens only (`bg-bg`, `bg-green`, `border-line`, `text-muted`, `font-mono` …). No raw hex values in components, no gradients, glows, `blur`, `animate-bounce`, or emoji in UI chrome.
- Active = filled `green`; inactive = 1px `line` outline + `muted` text. Radius is `12px` (`rounded-ui`). Touch targets are ≥ 44px.
- Section titles and item names are `font-mono`; controls and body text are `font-sans`.
- All copy is in Ukrainian and lowercase (see DESIGN.md). Copy states what happens («надіслати посилання», toast «Збережено»). Errors say what went wrong and what to do next.
- Respect `prefers-reduced-motion`. Give every interactive element a visible focus ring. Swipe always has a button equivalent.

## Code conventions
- TypeScript strict, no `any` (use `unknown` + zod at boundaries). Function components only; one component per file, named `PascalCase.tsx`; hooks are `useX.ts`.
- DB rows use snake_case (generated types). Map them to camelCase domain types in a feature's `mappers.ts`, and only there. Keep mappers pure (no Supabase client) so the seed script and e2e fixtures can import them in Node; network calls go in `api.ts`.
- Keep comments sparse; explain *why*, not what. No dead code or commented-out blocks.
- Commits: Conventional Commits with the ticket ID, e.g. `feat(menu): E3-2 mobile menu list`. One ticket per PR.

## Definition of Done
- [ ] The ticket's acceptance criteria in BACKLOG.md are met.
- [ ] `npm run lint`, `npm run test` and `npm run build` pass. E2E specs for touched routes pass in **both** `mobile` and `desktop` projects.
- [ ] The UI matches DESIGN.md and the proposal in both layouts (attach mobile 390px and desktop 1440px screenshots to the PR).
- [ ] New logic has unit tests. New tables/RPCs have pgTAP tests.
- [ ] No new axe serious/critical violations. No console errors.
- [ ] No secrets in code. `.env*` stays untouched in git.
- [ ] Docs updated if behaviour, routes, schema or tokens changed.

## Things agents must not do
- Don't re-introduce the removed features (advisors, steak guide, gastro constructor, .txt import) or localStorage persistence of menu/stats.
- Don't edit an applied migration. Add a new `supabase/migrations/NNNN_*.sql` instead.
- Don't run `supabase db push` against prod, delete Storage objects, or change Auth settings on prod from a local machine.
- Don't import from `src/data/` in app code (seed only).
