import { supabase } from '@/lib/supabase';

export async function fetchMenu() {
  const [categories, subcategories, items] = await Promise.all([
    supabase.from('categories').select('id, slug, name, sort'),
    supabase.from('subcategories').select('id, category_id, name, sort'),
    supabase.from('menu_items').select('*').eq('is_active', true),
  ]);
  const error = categories.error ?? subcategories.error ?? items.error;
  if (error) throw error;
  return { categories: categories.data!, subcategories: subcategories.data!, items: items.data! };
}
