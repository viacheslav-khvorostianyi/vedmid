import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HERE = import.meta.dirname;
const MIGRATIONS = join(HERE, '..', 'migrations');

/** Fresh in-memory Postgres with the Supabase shim and every migration applied, in order. */
export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(HERE, 'supabase-shim.sql'), 'utf8'));
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
  }
  return db;
}

/** Creates an auth user (the signup trigger creates profile + stats). Returns its id. */
export async function createUser(db: PGlite, email: string, role: 'waiter' | 'manager' = 'waiter') {
  await db.exec('reset role');
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, { display_name: email.split('@')[0] }],
  );
  const id = rows[0].id;
  if (role === 'manager') await db.query(`update public.profiles set role = 'manager' where id = $1`, [id]);
  return id;
}

/** Runs subsequent queries as the `authenticated` API role with this user's JWT subject. */
export async function actAs(db: PGlite, userId: string) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId]);
  await db.exec('set role authenticated');
}

export async function actAsAnon(db: PGlite) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  await db.exec('set role anon');
}

/** Back to the superuser (migrations/seed context). */
export async function actAsAdmin(db: PGlite) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
}
