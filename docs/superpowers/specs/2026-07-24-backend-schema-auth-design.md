# Royal Bakery Backend — Module 1: Database Schema + Auth/Profile Sync

Status: approved for planning
Date: 2026-07-24
Depends on: `docs/superpowers/specs/2026-07-12-project-scaffold-design.md` (existing `server/` and `client/` scaffold)

## Context

The project scaffold (client + server + Supabase wiring) exists but has no
database tables and no real feature routes — only a health check and two
demo routes (`/api/me`, `/api/admin/ping`) proving the JWT auth + RBAC
middleware works.

"Develop the full backend" per the project proposal spans several
subsystems: database schema, auth/profile sync, product/category catalog,
cart, orders, PayHere payments, inquiries, and admin reporting. That's too
large for a single spec, so it's being decomposed into a module sequence:

1. **Database schema + auth/profile sync** (this document)
2. Product & category catalog API
3. Cart & orders API
4. PayHere payment integration
5. Inquiries + admin reporting

Because later modules' tables (orders, cart, payments) all reference
`profiles`, `products`, and `categories`, this module defines the **entire
schema up front** in one migration set. Modules 2–5 build Express routes
and business logic on tables that already exist — they do not add new
tables except where noted as future work.

## Out of scope for this module

- Product/category CRUD routes, cart routes, order routes, PayHere
  integration, inquiry routes, reporting queries — these are Modules 2–5.
- Client-side UI for any of the above.
- Per-row RLS policies beyond deny-all (see Security below).

## Supabase project setup (manual, one-time)

Since no Supabase project exists yet:

1. Create a project at https://supabase.com (free tier is sufficient for
   development).
2. In **Project Settings → API**, copy:
   - Project URL → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
   - JWT Secret (Settings → API → JWT Settings) → `SUPABASE_JWT_SECRET`
     (kept for parity with `.env.example`; current `requireAuth` verifies
     tokens via `auth.getUser()`, a network call, not local JWT
     verification — this is intentionally not changed in this module).
3. Paste these into `server/.env` (copied from `server/.env.example`).
4. In **Project Settings → API**, also copy the `anon` public key and the
   Project URL into `client/.env.local` as `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (needed for Supabase Auth in the
   browser; login/register UI itself is not part of this module but the
   env wiring is a prerequisite).
5. Install the Supabase CLI (`npm install -g supabase` or per-OS
   instructions) and run `supabase login`, then `supabase link
   --project-ref <ref>` from `server/`.

## Migration tooling

Supabase CLI migrations, versioned in git:

```
server/
  supabase/
    migrations/
      0001_init_schema.sql
      0002_profile_trigger.sql
      0003_rls.sql
```

Applied with `supabase db push` after linking the project. Each migration
file is plain SQL (`CREATE TABLE`, `CREATE POLICY`, etc.) — no ORM.

## Access-control architecture

- The Express API always uses the Supabase **service-role** key
  (`getSupabaseAdmin()`, already implemented) and is the only thing that
  reads/writes business tables. The Next.js client only talks to Supabase
  directly for **Auth** (login/session cookies via `@supabase/ssr`); it
  never queries Postgres tables directly.
- Because of that, **Row Level Security is defense-in-depth, not the
  primary access-control layer**. Every business table gets
  `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with **zero policies**,
  which makes Postgres deny all access to any role other than
  `service_role` (which bypasses RLS entirely). This means even a leaked
  `anon` key cannot read or write any table.
- Actual authorization continues to live in the existing
  `requireAuth` (verifies the Supabase JWT, sets `req.user`) and
  `requireRole` (checks `req.user.role`) middleware, where `role` comes
  from `app_metadata.role` on the verified Supabase user object.
- `profiles.role` is a **denormalized copy** of `app_metadata.role`, kept
  for convenient SQL queries (e.g. "list all customers"). It is not a
  second source of truth: the only write path that changes a role is the
  admin "change role" endpoint (below), which updates `app_metadata` via
  the Supabase Admin API and `profiles.role` in the same request. No DB
  trigger tries to keep them in sync automatically.

## Database schema

All tables use `uuid` primary keys (`gen_random_uuid()`) unless noted.
Types are Postgres/Supabase (`timestamptz`, `numeric(10,2)` for money).

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id`, `references auth.users(id) on delete cascade` |
| `full_name` | `text` | nullable |
| `phone` | `text` | nullable |
| `address` | `text` | nullable |
| `role` | `text` | `not null default 'customer'`, `check (role in ('customer','admin'))` |
| `created_at` | `timestamptz` | `not null default now()` |

Auto-populated by a trigger on `auth.users` insert (see below) — never
inserted directly by the API.

### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` | `not null unique` |
| `description` | `text` | nullable |
| `is_active` | `boolean` | `not null default true` |
| `created_at` | `timestamptz` | `not null default now()` |

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `category_id` | `uuid` | `references categories(id) on delete set null` |
| `name` | `text` | `not null` |
| `description` | `text` | nullable |
| `price` | `numeric(10,2)` | `not null check (price >= 0)` |
| `image_url` | `text` | nullable |
| `stock_quantity` | `integer` | `not null default 0 check (stock_quantity >= 0)` |
| `is_available` | `boolean` | `not null default true` |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()` |

Index: `products(category_id)`.

### `cart_items`

No separate "cart" header table — a user's cart is just their rows in
`cart_items`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | `not null references profiles(id) on delete cascade` |
| `product_id` | `uuid` | `not null references products(id) on delete cascade` |
| `quantity` | `integer` | `not null check (quantity > 0)` |
| `created_at` | `timestamptz` | `not null default now()` |

Unique constraint: `(user_id, product_id)`.
Index: `cart_items(user_id)`.

### `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | `not null references profiles(id)` |
| `status` | `text` | `not null default 'pending'`, `check (status in ('pending','processing','completed','cancelled'))` |
| `payment_status` | `text` | `not null default 'unpaid'`, `check (payment_status in ('unpaid','paid','failed','refunded'))` |
| `total_amount` | `numeric(10,2)` | `not null check (total_amount >= 0)` |
| `delivery_address` | `text` | nullable |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()` |

Index: `orders(user_id)`, `orders(status)`.

### `order_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_id` | `uuid` | `not null references orders(id) on delete cascade` |
| `product_id` | `uuid` | `not null references products(id)` |
| `quantity` | `integer` | `not null check (quantity > 0)` |
| `unit_price` | `numeric(10,2)` | `not null` — snapshot of `products.price` at order time |
| `subtotal` | `numeric(10,2)` | `not null` — `quantity * unit_price`, computed by the API on insert |

Index: `order_items(order_id)`.

Snapshotting `unit_price`/`subtotal` means later product price changes
never retroactively alter historical order totals.

### `payments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_id` | `uuid` | `not null references orders(id)` |
| `payment_method` | `text` | `not null default 'payhere'` |
| `status` | `text` | `not null default 'pending'`, `check (status in ('pending','completed','failed','refunded'))` |
| `amount` | `numeric(10,2)` | `not null` |
| `transaction_id` | `text` | nullable |
| `payhere_payment_id` | `text` | nullable |
| `paid_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | `not null default now()` |

Index: `payments(order_id)`. Populated by Module 4 (PayHere webhook); this
module only creates the table.

### `inquiries`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | nullable, `references profiles(id)` — guests may submit inquiries without an account |
| `name` | `text` | `not null` |
| `email` | `text` | `not null` |
| `message` | `text` | `not null` |
| `status` | `text` | `not null default 'open'`, `check (status in ('open','resolved'))` |
| `created_at` | `timestamptz` | `not null default now()` |

Index: `inquiries(status)`.

## Auth → profile sync trigger

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Every Supabase Auth sign-up (however it happens — app sign-up form in a
future module, or a manually created user) gets a matching `profiles` row
with `role = 'customer'` by default.

## Express API surface

Base path `/api`, all routes JSON in/out, errors as
`{ error: { message } }` (existing `errorHandler` convention).

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | `requireAuth` | Returns `{ id, email, fullName, phone, address, role }` — merges the verified auth user's email with their `profiles` row. Replaces the demo `/api/me`. |
| `PUT` | `/users/me` | `requireAuth` | Body: `{ fullName?, phone?, address? }` (Zod-validated, all optional, at least one required). Updates own `profiles` row. `role` is not editable via this route. |
| `GET` | `/admin/customers` | `requireAuth` + `requireRole("admin")` | Returns all `profiles` rows (paginated later if needed; unpaginated is fine at current scale). |
| `PUT` | `/admin/customers/:id/role` | `requireAuth` + `requireRole("admin")` | Body: `{ role: "customer" \| "admin" }`. Updates `app_metadata.role` via the Supabase Admin API first; if that succeeds, updates `profiles.role`. If the second write fails, the response reports the partial-failure state explicitly (auth role changed, profile row stale) rather than silently swallowing it — full distributed-transaction rollback is out of scope for this module. |

The demo `/api/admin/ping` route is deleted. `/api/health` is unchanged.

## Admin bootstrap script

`server/scripts/setAdminRole.ts` (run via `tsx server/scripts/setAdminRole.ts <email>`):
looks up the user by email via the Supabase Admin API and sets
`app_metadata.role = "admin"` plus `profiles.role = "admin"`. This is how
the *first* admin account gets created, since promoting a user normally
requires an existing admin to call the `/admin/customers/:id/role` route.

## Testing approach

No live Supabase project is available in this environment, so testing
splits into two tiers:

**Automated (Vitest + Supertest, runs without credentials):**
- Zod validation: reject malformed `PUT /users/me` / role-update bodies.
- Auth guards: `requireAuth` returns 401 with no/invalid token;
  `requireRole("admin")` returns 403 for a non-admin token — Supabase
  admin client mocked so no network call happens.
- Route wiring smoke tests: correct status codes and response shapes for
  happy-path requests against a mocked Supabase client.

**Manual runbook (documented in the spec, run once by the user against
a real Supabase project):**
1. Apply migrations (`supabase db push`).
2. Sign up a test user through Supabase Auth (e.g. via the Supabase
   dashboard's "Add user" or a temporary script) → confirm a matching
   row appears in `profiles`.
3. Run `setAdminRole.ts <email>` for that user → confirm
   `GET /api/admin/customers` now succeeds with that user's token.
4. Using the `anon` key directly (e.g. via `curl` against Supabase's
   PostgREST endpoint, bypassing Express entirely) attempt to read
   `products` → confirm it is denied (RLS deny-all working).

This runbook becomes part of the implementation plan's Definition of Done.

## Open items carried to later modules

- Per-row RLS policies (e.g. letting customers read their own orders
  directly via Supabase) are deferred — only added if the architecture
  changes to have the client query Postgres directly.
- Pagination on `GET /admin/customers` — add when customer volume
  warrants it.
- `SUPABASE_JWT_SECRET` remains unused by `requireAuth` (which calls
  `auth.getUser()` over the network); switching to local JWT verification
  is a possible future optimization, not part of this module.
