-- Attribution for illustrative stock photos (docs/adr/0001-restaurant-theme-and-stock-photos.md).
-- { "text": "author, CC BY 2.0", "url": "https://…" }; null for the restaurant's own photos,
-- so uploading a real photo must reset it.
alter table public.menu_items
  add column photo_credit jsonb,
  add constraint photo_credit_shape check (
    photo_credit is null or (jsonb_typeof(photo_credit -> 'text') = 'string'
                             and jsonb_typeof(photo_credit -> 'url') = 'string'));
