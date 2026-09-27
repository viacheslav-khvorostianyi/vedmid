// @vitest-environment node
// PGlite boots a full Postgres in-process; allow for slow CI machines.
vi.setConfig({ hookTimeout: 60_000, testTimeout: 30_000 });
import type { PGlite } from '@electric-sql/pglite';
import { menuData } from '../../src/data/menuData';
import { ACHIEVEMENT_ROWS } from '../seed/achievements';
import { buildSeed, optional } from '../seed/buildSeed';
import { guestScenarios } from '../seed/guestScenarios';
import { writeSeed, type SeedWriter } from '../seed/writeSeed';
import { actAsAdmin, createTestDb } from './db';

/** Same semantics as the supabase-js writer in seed.ts, in SQL. */
function pgWriter(db: PGlite): SeedWriter & { changed: number } {
  const w = {
    changed: 0,
    async upsertSubcategories(rows, mode) {
      const conflict = mode === 'overwrite' ? 'do update set sort = excluded.sort' : 'do nothing';
      const res = await db.query(
        `insert into public.subcategories (category_id, name, sort)
         select * from jsonb_to_recordset($1::jsonb) as r(category_id smallint, name text, sort smallint)
         on conflict (category_id, name) ${conflict}`,
        [JSON.stringify(rows)],
      );
      w.changed += res.affectedRows ?? 0;
      return (
        await db.query<{ id: number; category_id: number; name: string }>(
          'select id, category_id, name from public.subcategories',
        )
      ).rows;
    },
    async upsertMenuItems(rows, mode) {
      const cols = Object.keys(rows[0]).filter((c) => c !== 'legacy_id');
      const conflict =
        mode === 'overwrite'
          ? `do update set ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}`
          : 'do nothing';
      const res = await db.query(
        `insert into public.menu_items (legacy_id, ${cols.join(', ')})
         select legacy_id, ${cols.join(', ')} from jsonb_populate_recordset(null::public.menu_items, $1::jsonb)
         on conflict (legacy_id) ${conflict}`,
        [JSON.stringify(rows)],
      );
      w.changed += res.affectedRows ?? 0;
    },
    async upsertGuestScenarios(rows, mode) {
      const conflict =
        mode === 'overwrite'
          ? 'do update set quote = excluded.quote, options = excluded.options'
          : 'do nothing';
      const res = await db.query(
        `insert into public.guest_scenarios (id, persona, avatar, quote, options, sort, is_active)
         select id, persona, avatar, quote, options, sort, is_active
         from jsonb_populate_recordset(null::public.guest_scenarios, $1::jsonb)
         on conflict (id) ${conflict}`,
        [JSON.stringify(rows)],
      );
      w.changed += res.affectedRows ?? 0;
    },
  } satisfies SeedWriter & { changed: number };
  return w;
}

describe('buildSeed', () => {
  const plan = buildSeed(menuData, guestScenarios);

  it('validates all 197 items with the expected split per category', () => {
    const perCategory = plan.items.reduce<Record<string, number>>((acc, i) => {
      const cat = i.subcategoryKey.split(':')[0];
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});
    expect(plan.items).toHaveLength(197);
    // food, wine, cocktails, beer_soft, spirits
    expect(perCategory).toEqual({ 1: 59, 2: 37, 3: 31, 4: 43, 5: 27 });
  });

  it('orders subcategories by first appearance within each category', () => {
    const food = plan.subcategories.filter((s) => s.categoryId === 1);
    expect(food[0]).toMatchObject({ name: 'Дитяче меню', sort: 1 });
    expect(food.map((s) => s.sort)).toEqual(food.map((_, i) => i + 1));
  });

  it('stores placeholders like «Не вказано» as not set', () => {
    const texts = plan.items.flatMap(({ input }) => [
      input.grapeVarieties,
      input.sweetness,
      input.pairing,
      input.interestingFact,
    ]);
    expect(texts.filter((t) => t && /не вказано/i.test(t))).toEqual([]);
    expect(plan.items.find((i) => i.input.legacyId === 'wine-1')!.input.grapeVarieties).toBeNull();
    expect(optional('Не вказано.')).toBeNull();
    expect(optional('Піно Грі')).toBe('Піно Грі');
    expect(optional(undefined)).toBeNull();
  });

  it('maps the 5 guest scenarios', () => {
    expect(plan.guestScenarios.map((g) => g.id)).toEqual(['g-1', 'g-2', 'g-3', 'g-4', 'g-5']);
  });

  it('rejects invalid items with a readable list', () => {
    const bad = { ...menuData[0], id: 'bad-1', title: '   ' };
    expect(() => buildSeed([bad], [])).toThrow(/bad-1: title Вкажіть назву/);
  });
});

describe('writeSeed into the real schema', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await createTestDb();
    await actAsAdmin(db);
  });
  afterAll(() => db.close());

  it('inserts everything, passing every table constraint', async () => {
    const writer = pgWriter(db);
    await writeSeed(buildSeed(menuData, guestScenarios), writer);
    const { rows } = await db.query<{ slug: string; n: number }>(
      `select c.slug, count(*)::int as n from public.menu_items m
       join public.subcategories s on s.id = m.subcategory_id join public.categories c on c.id = s.category_id
       group by c.slug order by c.slug`,
    );
    expect(Object.fromEntries(rows.map((r) => [r.slug, r.n]))).toEqual({
      beer_soft: 43,
      cocktails: 31,
      food: 59,
      spirits: 27,
      wine: 37,
    });
    expect((await db.query('select 1 from public.guest_scenarios')).rows).toHaveLength(5);
  });

  it('changes 0 rows on a second run and keeps manager edits', async () => {
    await db.query(`update public.menu_items set sales = 'Редакція менеджера' where legacy_id = 'soup-1'`);
    const writer = pgWriter(db);
    await writeSeed(buildSeed(menuData, guestScenarios), writer);
    expect(writer.changed).toBe(0);
    const { rows } = await db.query<{ sales: string }>(
      `select sales from public.menu_items where legacy_id = 'soup-1'`,
    );
    expect(rows[0].sales).toBe('Редакція менеджера');
  });

  it('keeps the TypeScript achievements in sync with the migration', async () => {
    const { rows } = await db.query(
      'select id, title, description, icon, xp_reward, rule, sort from public.achievements order by sort',
    );
    expect(rows).toEqual(ACHIEVEMENT_ROWS);
  });

  it('resets existing rows only in overwrite mode', async () => {
    await writeSeed(buildSeed(menuData, guestScenarios), pgWriter(db), 'overwrite');
    const { rows } = await db.query<{ sales: string }>(
      `select sales from public.menu_items where legacy_id = 'soup-1'`,
    );
    expect(rows[0].sales).toMatch(/^Наш борщ на овочевому бульйоні/);
  });
});
