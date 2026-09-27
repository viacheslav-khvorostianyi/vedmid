// @vitest-environment node
// PGlite boots a full Postgres in-process; allow for slow CI machines.
vi.setConfig({ hookTimeout: 60_000, testTimeout: 30_000 });
import type { PGlite } from '@electric-sql/pglite';
import { actAs, actAsAdmin, actAsAnon, createTestDb, createUser } from './db';
import { seedMenuFixture } from './fixtures';

let db: PGlite;
let waiter: string;
let other: string;
let manager: string;
let menu: Awaited<ReturnType<typeof seedMenuFixture>>;

beforeAll(async () => {
  db = await createTestDb();
  waiter = await createUser(db, 'olena@test.local');
  other = await createUser(db, 'petro@test.local');
  manager = await createUser(db, 'iryna@test.local', 'manager');
  menu = await seedMenuFixture(db);
  // progress for both waiters, written the only allowed way
  for (const uid of [waiter, other]) {
    await actAs(db, uid);
    await db.query(`select * from public.record_answer($1, true, 'card')`, [menu.activeId]);
  }
});

afterAll(() => db.close());

const count = async (sql: string, params: unknown[] = []) =>
  (await db.query<{ n: number }>(`select count(*)::int as n from (${sql}) t`, params)).rows[0].n;

describe('signup trigger', () => {
  it('creates a waiter profile with a display name and a stats row', async () => {
    await actAsAdmin(db);
    const { rows } = await db.query<{ role: string; display_name: string; xp: number }>(
      `select p.role, p.display_name, s.xp from public.profiles p join public.player_stats s on s.user_id = p.id where p.id = $1`,
      [other],
    );
    expect(rows[0]).toMatchObject({ role: 'waiter', display_name: 'petro' });
  });
});

describe('anon', () => {
  it.each(['categories', 'menu_items', 'profiles', 'player_stats', 'achievements'])(
    'reads nothing from %s',
    async (table) => {
      await actAsAnon(db);
      expect(await count(`select * from public.${table}`)).toBe(0);
    },
  );

  it('cannot call record_answer', async () => {
    await actAsAnon(db);
    await expect(db.query(`select * from public.record_answer(null, true, 'quiz')`)).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe('waiter', () => {
  beforeEach(() => actAs(db, waiter));

  it('reads categories, achievements and only active menu items', async () => {
    expect(await count('select * from public.categories')).toBe(5);
    expect(await count('select * from public.achievements')).toBe(5);
    expect(await count('select * from public.menu_items')).toBe(1);
  });

  it('cannot insert, update or delete menu items', async () => {
    await expect(
      db.query(`insert into public.menu_items (subcategory_id, title) values ($1, 'Хак')`, [
        menu.subcategoryId,
      ]),
    ).rejects.toThrow(/row-level security/);
    const upd = await db.query(`update public.menu_items set title = 'Хак' where id = $1`, [menu.activeId]);
    expect(upd.affectedRows).toBe(0);
    const del = await db.query(`delete from public.menu_items where id = $1`, [menu.activeId]);
    expect(del.affectedRows).toBe(0);
  });

  it('sees only their own progress, stats, answers and achievements', async () => {
    for (const table of [
      'card_progress',
      'player_stats',
      'answer_log',
      'user_achievements',
      'game_results',
    ]) {
      expect(await count(`select * from public.${table} where user_id = $1`, [other])).toBe(0);
    }
    expect(await count('select * from public.card_progress where user_id = $1', [waiter])).toBe(1);
  });

  it('cannot write progress tables directly', async () => {
    const upd = await db.query(`update public.player_stats set xp = 99999 where user_id = $1`, [waiter]);
    expect(upd.affectedRows).toBe(0);
    await expect(
      db.query(`insert into public.user_achievements (user_id, achievement_id) values ($1, 'ach-3')`, [
        waiter,
      ]),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db.query(`insert into public.answer_log (user_id, source, correct) values ($1, 'quiz', true)`, [
        waiter,
      ]),
    ).rejects.toThrow(/row-level security/);
  });

  it('can rename themselves but not promote themselves', async () => {
    const ok = await db.query(`update public.profiles set display_name = 'Олена К.' where id = $1`, [waiter]);
    expect(ok.affectedRows).toBe(1);
    await expect(
      db.query(`update public.profiles set role = 'manager' where id = $1`, [waiter]),
    ).rejects.toThrow(/row-level security/);
    const others = await db.query(`update public.profiles set display_name = 'x' where id = $1`, [other]);
    expect(others.affectedRows).toBe(0);
  });

  it('cannot call set_role', async () => {
    await expect(db.query(`select public.set_role($1, 'manager')`, [waiter])).rejects.toThrow(/forbidden/);
  });

  it('cannot upload dish photos', async () => {
    await expect(
      db.query(`insert into storage.objects (bucket_id, name) values ('dish-photos', 'x/hack.webp')`),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('manager', () => {
  beforeEach(() => actAs(db, manager));

  it('sees inactive items and all staff progress', async () => {
    expect(await count('select * from public.menu_items')).toBe(2);
    expect(await count('select * from public.player_stats')).toBe(3);
  });

  it('creates and edits menu items; updated_by is stamped', async () => {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.menu_items (subcategory_id, title) values ($1, 'Юшка з лісових грибів') returning id`,
      [menu.subcategoryId],
    );
    await db.query(`update public.menu_items set sales = 'Смак осіннього лісу' where id = $1`, [rows[0].id]);
    const check = await db.query<{ updated_by: string; sales: string }>(
      `select updated_by, sales from public.menu_items where id = $1`,
      [rows[0].id],
    );
    expect(check.rows[0]).toEqual({ updated_by: manager, sales: 'Смак осіннього лісу' });
  });

  it('uploads dish photos but not into other buckets', async () => {
    await db.query(`insert into storage.objects (bucket_id, name) values ('dish-photos', 'soup-1/a.webp')`);
    await actAsAdmin(db);
    await db.query(`insert into storage.buckets (id, name) values ('other', 'other') on conflict do nothing`);
    await actAs(db, manager);
    await expect(
      db.query(`insert into storage.objects (bucket_id, name) values ('other', 'x')`),
    ).rejects.toThrow(/row-level security/);
  });

  it('changes roles but cannot demote themselves', async () => {
    await db.query(`select public.set_role($1, 'manager')`, [other]);
    await db.query(`select public.set_role($1, 'waiter')`, [other]);
    await expect(db.query(`select public.set_role($1, 'waiter')`, [manager])).rejects.toThrow(
      /cannot demote/,
    );
  });
});
