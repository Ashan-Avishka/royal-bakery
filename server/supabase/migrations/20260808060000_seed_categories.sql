-- Seed a fuller bakery catalog so the storefront category showcase
-- has enough collections to display (idempotent on unique name).

insert into public.categories (name, description, is_active)
values
  ('Pastries', 'Croissants, danishes, and flaky layers', true),
  ('Breads', 'Fresh loaves and rolls baked daily', true),
  ('Cookies', 'Crisp, chewy, and chocolate-packed favourites', true),
  ('Sweets', 'Donuts, muffins, and everyday treats', true),
  ('Savouries', 'Savoury bakes for any time of day', true),
  ('Cupcakes', 'Individual cakes finished with care', true),
  ('Celebration', 'Special-occasion centrepieces made to order', true)
on conflict (name) do nothing;
