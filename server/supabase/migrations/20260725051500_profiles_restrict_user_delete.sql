-- profiles.id previously cascaded from auth.users(id), but orders/inquiries/payments
-- reference profiles(id) with the default NO ACTION (restrict). Deleting an auth user
-- with existing order history would cascade into profiles, then hit the orders/inquiries
-- FK and abort with a raw constraint-violation error deep in the deletion flow.
--
-- Policy: block deletion, preserve order/financial history. Change profiles.id to
-- ON DELETE RESTRICT so a user with a profile cannot be deleted at all (explicit,
-- consistent with orders/inquiries/payments already restricting), rather than
-- silently cascading partway and failing unpredictably downstream.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and confrelid = 'auth.users'::regclass
    and contype = 'f';

  if cname is not null then
    execute format('alter table public.profiles drop constraint %I', cname);
  end if;

  execute 'alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete restrict';
end $$;
