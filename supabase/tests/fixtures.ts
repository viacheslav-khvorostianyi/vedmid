import type { PGlite } from '@electric-sql/pglite';
import { actAsAdmin } from './db';

/** Two food items (one inactive) under «Перші страви». Returns their ids. */
export async function seedMenuFixture(db: PGlite) {
  await actAsAdmin(db);
  const sub = await db.query<{ id: number }>(
    `insert into public.subcategories (category_id, name, sort) values (1, 'Перші страви', 1) returning id`,
  );
  const items = await db.query<{ id: string }>(
    `insert into public.menu_items (legacy_id, subcategory_id, title, allergens, is_active) values
       ('soup-1', $1, 'Борщ з пампушкою та салом із чорним часником', '{глютен,лактоза}', true),
       ('soup-x', $1, 'Архівний суп', '{}', false)
     returning id`,
    [sub.rows[0].id],
  );
  return { subcategoryId: sub.rows[0].id, activeId: items.rows[0].id, inactiveId: items.rows[1].id };
}
