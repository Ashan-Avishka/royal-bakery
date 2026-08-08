-- Fix typo in the Cakes category description.

update public.categories
set description = 'Classic Sri Lankan cakes by slab or whole'
where name = 'Cakes';
