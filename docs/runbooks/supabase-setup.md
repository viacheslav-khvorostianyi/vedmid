# Runbook — Supabase setup (E2-1)

These steps need a Supabase account and access to the restaurant's email domain, so a person has to do them. Everything in the repo (config, migration, seed, function) is ready.

## 1. Local stack (developers)
Requires Docker Desktop.
```bash
npm install                 # installs the Supabase CLI (devDependency)
npm run db:start            # supabase start — prints API URL, anon key, service_role key
npm run db:reset            # applies supabase/migrations
cp .env.example .env.local  # VITE_SUPABASE_URL=http://127.0.0.1:54321, VITE_SUPABASE_ANON_KEY=<anon key>
printf 'SUPABASE_URL=http://127.0.0.1:54321\nSUPABASE_SERVICE_ROLE_KEY=<service_role key>\n' > .env.seed
npm run db:seed             # 197 items, 31 subcategories, 5 guest scenarios
npm run db:types            # regenerate src/lib/db.types.ts from the real schema; commit if it changed
npm run dev
```
Local emails (magic links, invites) are caught by Inbucket at http://127.0.0.1:54324.
Signups are disabled, so create your first local user in Studio (http://127.0.0.1:54323 → Authentication → Add user) and make yourself a manager:
```sql
update public.profiles set role = 'manager' where id = (select id from auth.users where email = 'you@example.com');
```

## 2. Cloud projects
1. Create the projects `vedmid-dev` and `vedmid-prod` in region **eu-central-1 (Frankfurt)**. Store the DB passwords in the team password manager.
2. `npx supabase login`, then `npx supabase link --project-ref <ref>` and `npx supabase db push` (dev first).
3. **Auth → Providers → Email:** enabled. **Allow new users to sign up: off**. Confirm email: on. OTP length 6, OTP expiry 3600 s.
4. **Auth → URL configuration:** Site URL = the prod domain. Redirect URLs = `https://<prod-domain>/login`, `https://*-vedmid.vercel.app/login`, `http://localhost:3000/login`.
5. **Auth → SMTP (prod):** Resend. Sender `ведмідь@<restaurant domain>`. Verify SPF/DKIM before inviting staff.
6. **Auth → Email templates:** Ukrainian texts for "Invite user" and "Magic link". Include `{{ .Token }}` so the 6-digit code fallback on the login screen works.
7. **Edge Function:** `npx supabase functions deploy invite-staff`, then `npx supabase secrets set SITE_URL=https://<prod-domain> ALLOWED_ORIGINS=https://<prod-domain>`.
8. Seed: put the project URL and service_role key into `.env.seed`, then run `npm run db:seed` (dev, then prod after the chef's allergen review, E8-6).
9. First manager: Authentication → Invite user, then run the SQL from step 1 in the SQL editor.
10. Upgrade prod to **Pro** before go-live (no auto-pausing, daily backups).

## 3. App environment (Vercel)
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` per environment (Preview → dev project, Production → prod project).
