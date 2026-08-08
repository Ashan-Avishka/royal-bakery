-- Active Royal Bakery catalog categories (idempotent on unique name).
-- Extra previously-seeded categories are deactivated below.

insert into public.categories (name, description, is_active)
values
  ('Breads', 'Soft sandwich loaves and everyday breads', true),
  ('Buns', 'Sweet and savoury buns fresh from the oven', true),
  ('Cakes', 'Classic Sri Lankan bakery cakes by the slab or whole', true),
  ('Rolls', 'Crispy rolls filled and fried to order', true),
  ('Patties', 'Golden short-eat patties for tea time', true),
  ('Rotti', 'Soft bakery rotti with classic fillings', true),
  ('Pastries', 'Flaky pastries and bakery short eats', true),
  ('Sweets', 'Tea-time sweets and soft bakery treats', true)
on conflict (name) do update
set
  description = excluded.description,
  is_active = true;

update public.categories
set is_active = false
where name not in (
  'Breads',
  'Buns',
  'Cakes',
  'Rolls',
  'Patties',
  'Rotti',
  'Pastries',
  'Sweets'
);
