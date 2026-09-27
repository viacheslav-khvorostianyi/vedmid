# Ведмідь

[![CI](https://github.com/viacheslav-khvorostianyi/vedmid/actions/workflows/ci.yml/badge.svg)](https://github.com/viacheslav-khvorostianyi/vedmid/actions/workflows/ci.yml)

**Live demo:** https://viacheslav-khvorostianyi.github.io/vedmid/ (no backend needed; see «demo mode» below)

Knowledge base and training app for the waiters of the restaurant «Просто ЛІС»: menu lookup (composition, allergens, pairing, sales phrase), flashcards, games and profile.
Mobile-first PWA with a separate desktop layout. Backend: Supabase.

> **Status:** redesign in progress. E0–E2 are done: shells, UI kit, Supabase schema, auth (magic link) and the offline queue.
> Feature screens are still placeholders (E3+).
> The old prototype is kept in `src/legacy/` for reference until it is ported.

## Documents
- [AGENTS.md](AGENTS.md): rules for developers and AI agents (start here)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): technical specification
- [docs/DESIGN.md](docs/DESIGN.md) and the [interactive design proposal](https://claude.ai/artifact/HsMvF2sG8wqS3NCFbpGQNc): design system, mobile and desktop screens
- [docs/BACKLOG.md](docs/BACKLOG.md): tickets in order, with acceptance criteria
- [docs/agents/](docs/agents/): role briefs (frontend-mobile, frontend-desktop, backend-supabase, qa)
- [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql): DB schema, RLS, RPCs

## Try it without a backend (demo mode)
```bash
npm install
npm run demo        # http://localhost:3000, signed in automatically
```
The demo runs the real app against a fake backend in the browser (a Mock Service Worker answers every Supabase request), using the real 197-item menu. XP, streaks, flashcard boxes and achievements follow the same rules as the server, and progress is saved in this browser only. Use the «демо» button (bottom right) to switch between waiter and manager or reset the demo data. After «вийти», sign in with any email and any 6 digits as the code.
`npm run demo:build` produces a static demo in `dist-demo/` that can be hosted anywhere; the live demo above is deployed from `main` automatically. Normal builds contain no demo code.

## Run locally
Requirements: Node.js 24 LTS (see `.nvmrc`; e.g. `nvm use`), Docker (for local Supabase), [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
npm run dev                       # http://localhost:3000 (needs .env.local, see the runbook)
npm run lint && npm test          # typecheck + ESLint, unit tests
npx playwright install chromium   # once
npm run test:e2e                  # e2e in mobile + desktop projects
```
To run with a backend, set up Supabase locally or in the cloud: [docs/runbooks/supabase-setup.md](docs/runbooks/supabase-setup.md). The unit, DB and e2e tests need no backend.
