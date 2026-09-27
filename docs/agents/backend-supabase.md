# Role brief — Backend (Supabase)

**You own:** `supabase/` (migrations, seed, pgTAP tests, Edge Functions), Supabase project configuration, CI migration deploys, backups.
**Tickets:** E2-1…6, E8-2, E8-4, E8-6.
**Read first:** AGENTS.md → ARCHITECTURE.md §4.3–4.7, §4.11 → `supabase/migrations/0001_init.sql`.

## Ground rules
- Every change is a new migration file `supabase/migrations/NNNN_description.sql`. Never edit one that has been applied to dev/prod.
- Every table has RLS enabled (default deny) and a pgTAP test that proves both the allowed and the denied paths.
- All progress writes go through `security definer` RPCs with `set search_path = public`, and grant `execute` only to `authenticated`.
- The service-role key exists only in Edge Function secrets, `.env.seed` (gitignored) and GitHub secrets.

## Setup checklist (E2-1)
- [ ] `supabase init`, `supabase start` works locally.
- [ ] Projects `vedmid-dev`, `vedmid-prod` in **eu-central-1**.
- [ ] Auth → Email: enabled; **Allow new users to sign up: off**; magic link + OTP (6 digits), OTP expiry 1h.
- [ ] Auth → URL config: site URL = prod domain; redirect allow-list = prod, `https://*-vedmid.vercel.app`, `http://localhost:3000`.
- [ ] Custom SMTP (Resend) on prod, sender `ведмідь@<restaurant domain>`, SPF/DKIM verified. Ukrainian email templates for invite and magic link.
- [ ] First manager: invite from the dashboard, then `update profiles set role='manager' where id=…` (one-off, documented in the runbook).

## Seed (E2-3)
`supabase/seed.ts`:
1. Import `menuData` (typed `SeedMenuItem[]`, see `src/data/types.ts`) from `src/data/menuData.ts`. Achievements are already seeded by `0001_init.sql`. Copy `guestScenarios` out of `src/legacy/components/GameTab.tsx` into `supabase/seed-data/guestScenarios.ts` first.
2. Map `category` via `categories.legacy_name`. Upsert subcategories `(category_id, name)` with `sort` in order of first appearance.
3. Upsert `menu_items` on `legacy_id`, validated with the shared `menuItemInputSchema` (`src/features/manager/schema.ts`). Fail loudly on invalid rows. The default mode only inserts missing rows, so managers' edits survive re-runs; `--overwrite` resets existing rows to the static data. `--dry-run` validates without writing.
4. Print counts per category. Expected: food 59, wine 37, cocktails 31, beer_soft 43, spirits 27 (total 197).

## `invite-staff` Edge Function (E2-6)
```ts
// POST { email: string, display_name: string }
// 1. createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') } } })
// 2. rpc('is_manager') must return true, else 403
// 3. admin = createClient(url, SERVICE_ROLE); admin.auth.admin.inviteUserByEmail(email, { data: { display_name }, redirectTo: SITE_URL })
// 4. 200 { ok: true } | 400 { error: 'invalid_email' } | 403 { error: 'forbidden' } | 409 { error: 'already_invited' }
```
Validate the input with zod. CORS is allowed only for the site origins.

## Tests (E2-4, E2-5)
DB tests live in `supabase/tests/*.test.ts` and run in **PGlite** (Postgres in WebAssembly) inside `npm test`, so no Docker is needed.
- `supabase-shim.sql` stands in for Supabase's `auth.users`, `auth.uid()`, `storage.*`, the API roles and the default grants.
- `db.ts` provides `createTestDb()` (shim + every migration, in order), `createUser()`, `actAs(db, userId)`, `actAsAnon()` and `actAsAdmin()`.
- `rls.test.ts` covers allow and deny per role. `rpc.test.ts` covers XP, streaks, Leitner, achievements and the rate cap. `seed.test.ts` inserts the full seed into the real schema.
- When a migration uses a Supabase feature the shim lacks, extend the shim minimally, and keep verifying on a real stack (`npm run db:reset`) before pushing.

## Operations
- CI deploy on main: `supabase link --project-ref $SUPABASE_PROJECT_REF && supabase db push`.
- Backups: Pro daily backups, or a weekly `pg_dump` workflow to an encrypted artifact (30 days). Restore drill on dev once before go-live.
- Keep-alive (free tier only): a daily scheduled workflow does `select 1` via REST.
- Allergen sign-off (E8-6): export `select title, allergens, ingredients from menu_items join subcategories … where category = food` to CSV for the chef.
