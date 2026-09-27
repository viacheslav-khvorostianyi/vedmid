import { buildMenu } from '@/features/menu/model';
import { buildFixtureRows } from '../../supabase/seed/fixtureRows';

/** Raw rows as returned by fetchMenu (what the ['menu'] query caches). */
export const MENU_ROWS = buildFixtureRows();
/** The real menu (197 items) as the app sees it. */
export const MENU = buildMenu(MENU_ROWS.categories, MENU_ROWS.subcategories, MENU_ROWS.items);

export const BORSCH_ID = 'item-soup-1';
export const WINE_ID = 'item-wine-1';
