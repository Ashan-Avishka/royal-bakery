# Royal Bakery Backend — Schema + Auth/Profile Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full Supabase database schema for Royal Bakery and replace the scaffold's demo auth routes with real profile-management and admin-user-management endpoints.

**Architecture:** Supabase Postgres holds 8 tables (profiles, categories, products, cart_items, orders, order_items, payments, inquiries), all RLS-enabled with zero policies (deny-all — the Express API is the only writer, always via the service-role key). A trigger auto-creates a `profiles` row on every Supabase Auth sign-up. Express gains a thin service layer (`profileService.ts`) that all routes call through, plus Zod-validated `/api/users/me` and `/api/admin/customers*` routes.

**Tech Stack:** Express 5, TypeScript (NodeNext ESM, `.js` import extensions required even for `.ts` files), Zod 4, `@supabase/supabase-js` 2, Vitest + Supertest for testing, Supabase CLI for migrations.

## Global Constraints

- ESM + NodeNext module resolution: every relative import must end in `.js` (even though the source file is `.ts`) — this already matches the existing scaffold (`server/src/app.ts` etc.).
- Error responses are always `{ error: { message: string } }` — the existing `errorHandler` convention. Route handlers pass errors to `next(err)`; they don't format error bodies themselves except for 400 validation errors.
- Money columns are `numeric(10,2)`. `order_items.unit_price` / `subtotal` are snapshots taken at order-creation time — this module only creates the columns, no order-creation code yet (Module 3).
- RLS is enabled on every business table with **zero policies** (deny-all for `anon`/`authenticated`; `service_role` bypasses RLS entirely). Do not add per-row policies in this module.
- `profiles.role` is written **only** through `profileService.setUserRole()`, which updates Supabase Auth `app_metadata.role` and `profiles.role` together. Nothing else writes `profiles.role`.
- **Do not run `git commit` or `git push`.** Each task's last step is `git add` (staging) only — the user reviews and commits their own changes.
- Do not modify `server/src/middleware/auth.ts` or `requireRole.ts` — they already work correctly for this module (`req.user.role` comes from `app_metadata.role`, verified in Module scaffold review).

---

### Task 1: Supabase project setup and schema migrations

**Files:**
- Create: `server/supabase/config.toml` (via `supabase init`)
- Create: `server/supabase/migrations/<timestamp>_init_schema.sql`
- Create: `server/supabase/migrations/<timestamp>_profile_trigger.sql`
- Create: `server/supabase/migrations/<timestamp>_rls.sql`
- Modify: `server/.env` (not committed — already gitignored)
- Modify: `client/.env.local` (not committed — already gitignored)

**Interfaces:**
- Produces: 8 live Postgres tables (`profiles`, `categories`, `products`, `cart_items`, `orders`, `order_items`, `payments`, `inquiries`) that every later task's code queries via `getSupabaseAdmin()`.

This task is manual/human-driven (external account creation, dashboard clicks) — there is no automated test for it. Follow the steps in order and confirm each before moving on.

- [ ] **Step 1: Create the Supabase project**

Go to https://supabase.com, sign in, click "New Project". Pick any name/region/database password (save the password somewhere — you won't need it for the API, only if you ever connect a raw Postgres client). Wait for provisioning to finish (~2 minutes).

- [ ] **Step 2: Collect credentials**

In the new project, go to **Project Settings → API** and copy:
- **Project URL**
- **`anon` `public` key**
- **`service_role` `secret` key**

Go to **Project Settings → API → JWT Settings** and copy:
- **JWT Secret**

- [ ] **Step 3: Fill in server and client env files**

If `server/.env` doesn't exist yet, copy it from the example first:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set:
```
SUPABASE_URL=<Project URL>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret key>
SUPABASE_JWT_SECRET=<JWT Secret>
```

Edit (or create) `client/.env.local` and set:
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

- [ ] **Step 4: Install and link the Supabase CLI**

```bash
npm install -g supabase
supabase login
```

`supabase login` opens a browser to authenticate the CLI. Then, from the `server/` directory:

```bash
cd server
supabase init
```

This creates `server/supabase/config.toml`. Next, find your project ref — it's the subdomain in your Project URL (e.g. `https://abcdefghij.supabase.co` → ref is `abcdefghij`):

```bash
supabase link --project-ref <your-project-ref>
```

It will prompt for the database password from Step 1.

- [ ] **Step 5: Generate the three migration files**

Still from `server/`:

```bash
supabase migration new init_schema
supabase migration new profile_trigger
supabase migration new rls
```

Each command creates an empty, timestamp-prefixed `.sql` file under `server/supabase/migrations/`. Note the three filenames it printed — you'll paste content into them next.

- [ ] **Step 6: Paste the schema into `<timestamp>_init_schema.sql`**

Open the file from the first `migration new` command and replace its contents with:

```sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products(category_id);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index cart_items_user_id_idx on public.cart_items(user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  subtotal numeric(10, 2) not null
);
create index order_items_order_id_idx on public.order_items(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  payment_method text not null default 'payhere',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  amount numeric(10, 2) not null,
  transaction_id text,
  payhere_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index payments_order_id_idx on public.payments(order_id);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries(status);
```

- [ ] **Step 7: Paste the trigger into `<timestamp>_profile_trigger.sql`**

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

- [ ] **Step 8: Paste the RLS statements into `<timestamp>_rls.sql`**

```sql
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inquiries enable row level security;
```

- [ ] **Step 9: Apply the migrations**

From `server/`:

```bash
supabase db push
```

Confirm when prompted. It should report all three migrations applied successfully.

- [ ] **Step 10: Verify in the dashboard**

Open the Supabase Dashboard → **Table Editor**. Confirm all 8 tables exist: `profiles`, `categories`, `products`, `cart_items`, `orders`, `order_items`, `payments`, `inquiries`. Click into `products` → confirm a shield/lock icon or "RLS enabled" indicator is shown (no policies listed).

- [ ] **Step 11: Stage the migration files**

```bash
git add server/supabase
git status
```

Confirm `server/supabase/config.toml` and the three migration files show as new files staged. **Do not commit** — `server/.env` and `client/.env.local` should NOT appear in `git status` (they're gitignored; if they do appear, stop and check `.gitignore` before continuing).

---

### Task 2: Testing infrastructure (Vitest + Supertest + fake Supabase client)

**Files:**
- Create: `server/vitest.config.ts`
- Create: `server/src/test/fakeSupabase.ts`
- Create: `server/src/test/fakeSupabase.test.ts`
- Modify: `server/package.json`
- Modify: `server/tsconfig.json`

**Interfaces:**
- Produces: `createFakeSupabaseClient(options: { usersByToken: Record<string, FakeAuthUser>; profiles: FakeProfileRow[] })` from `server/src/test/fakeSupabase.ts`, returning an object shaped like enough of `SupabaseClient` to drive `profileService.ts` and `middleware/auth.ts` in tests: `.from("profiles")` (supporting `select().eq().maybeSingle()`, `select().order()`, `update().eq().select().single()`), `.auth.getUser(token)`, `.auth.admin.getUserById(id)`, `.auth.admin.updateUserById(id, patch)`, `.auth.admin.listUsers()`.
- Produces: `FakeAuthUser { id: string; email?: string; app_metadata: { role?: string } }` and `FakeProfileRow { id: string; full_name: string | null; phone: string | null; address: string | null; role: "customer" | "admin"; created_at: string }` types, exported from the same file.
- Produces: `npm run test` (from `server/`) runs Vitest once and exits.

- [ ] **Step 1: Add test dependencies and script to `server/package.json`**

Modify `server/package.json` — add to `"scripts"`:

```json
"test": "vitest run",
```

Add to `"devDependencies"`:

```json
"vitest": "^3.2.0",
"supertest": "^7.1.0",
"@types/supertest": "^6.0.2",
```

- [ ] **Step 2: Install**

```bash
cd server
npm install
```

- [ ] **Step 3: Exclude test files from the production build**

Modify `server/tsconfig.json` — add an `"exclude"` key so `npm run build` doesn't try to compile test files into `dist/`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 4: Add the Vitest config**

Create `server/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: Write the failing test for the fake Supabase client**

Create `server/src/test/fakeSupabase.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createFakeSupabaseClient } from "./fakeSupabase.js";

describe("createFakeSupabaseClient", () => {
  it("supports select().eq().maybeSingle() lookups", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [
        {
          id: "p1",
          full_name: "Test User",
          phone: null,
          address: null,
          role: "customer",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", "p1")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.full_name).toBe("Test User");
  });

  it("supports update().eq().select().single() mutations", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [
        {
          id: "p1",
          full_name: "Old Name",
          phone: null,
          address: null,
          role: "customer",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const { data, error } = await client
      .from("profiles")
      .update({ full_name: "New Name" })
      .eq("id", "p1")
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data?.full_name).toBe("New Name");
  });

  it("resolves auth.getUser() based on the provided token", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {
        "valid-token": { id: "u1", email: "a@b.com", app_metadata: { role: "customer" } },
      },
      profiles: [],
    });

    const ok = await client.auth.getUser("valid-token");
    expect(ok.data.user?.id).toBe("u1");

    const bad = await client.auth.getUser("bad-token");
    expect(bad.data.user).toBeNull();
    expect(bad.error).not.toBeNull();
  });
});
```

- [ ] **Step 6: Run it to confirm it fails**

```bash
cd server
npm run test
```

Expected: FAIL — `Cannot find module './fakeSupabase.js'` (the file doesn't exist yet).

- [ ] **Step 7: Implement the fake client**

Create `server/src/test/fakeSupabase.ts`:

```ts
export interface FakeAuthUser {
  id: string;
  email?: string;
  app_metadata: { role?: string };
}

export interface FakeProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
}

interface FakeSupabaseOptions {
  usersByToken: Record<string, FakeAuthUser>;
  profiles: FakeProfileRow[];
}

export function createFakeSupabaseClient(options: FakeSupabaseOptions) {
  const { usersByToken, profiles } = options;

  function from(table: string) {
    if (table !== "profiles") {
      throw new Error(`FakeSupabaseClient: unsupported table "${table}"`);
    }

    return {
      select() {
        return {
          eq(column: keyof FakeProfileRow, value: string) {
            return {
              async maybeSingle() {
                const row = profiles.find((p) => p[column] === value);
                return { data: row ?? null, error: null };
              },
            };
          },
          order(column: keyof FakeProfileRow, opts: { ascending: boolean }) {
            const sorted = [...profiles].sort((a, b) => {
              const av = a[column];
              const bv = b[column];
              const cmp = av! < bv! ? -1 : av! > bv! ? 1 : 0;
              return opts.ascending ? cmp : -cmp;
            });
            return Promise.resolve({ data: sorted, error: null });
          },
        };
      },
      update(patch: Partial<FakeProfileRow>) {
        return {
          eq(column: keyof FakeProfileRow, value: string) {
            return {
              select() {
                return {
                  async single() {
                    const row = profiles.find((p) => p[column] === value);
                    if (!row) {
                      return { data: null, error: { message: "Row not found" } };
                    }
                    Object.assign(row, patch);
                    return { data: row, error: null };
                  },
                };
              },
            };
          },
        };
      },
    };
  }

  return {
    from,
    auth: {
      async getUser(token: string) {
        const user = usersByToken[token];
        if (!user) {
          return { data: { user: null }, error: { message: "Invalid token" } };
        }
        return { data: { user }, error: null };
      },
      admin: {
        async getUserById(id: string) {
          const user = Object.values(usersByToken).find((u) => u.id === id);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          return { data: { user }, error: null };
        },
        async updateUserById(
          id: string,
          patch: { app_metadata?: Record<string, unknown> }
        ) {
          const user = Object.values(usersByToken).find((u) => u.id === id);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          if (patch.app_metadata) {
            user.app_metadata = { ...user.app_metadata, ...patch.app_metadata };
          }
          return { data: { user }, error: null };
        },
        async listUsers() {
          return { data: { users: Object.values(usersByToken) }, error: null };
        },
      },
    },
  };
}
```

- [ ] **Step 8: Run the test to confirm it passes**

```bash
cd server
npm run test
```

Expected: PASS (3 tests in `fakeSupabase.test.ts`).

- [ ] **Step 9: Stage**

```bash
git add server/package.json server/package-lock.json server/tsconfig.json server/vitest.config.ts server/src/test
```

---

### Task 3: Profile types and service layer

**Files:**
- Create: `server/src/types/profile.ts`
- Create: `server/src/services/profileService.ts`
- Test: `server/src/services/profileService.test.ts`

**Interfaces:**
- Consumes: `createFakeSupabaseClient` from `../test/fakeSupabase.js` (Task 2); `getSupabaseAdmin` from `../lib/supabase.js` (existing scaffold).
- Produces: `Profile { id: string; fullName: string | null; phone: string | null; address: string | null; role: "customer" | "admin"; createdAt: string }` from `server/src/types/profile.ts`.
- Produces: `getProfileById(id: string): Promise<Profile | null>`, `updateProfile(id: string, fields: { fullName?: string; phone?: string; address?: string }): Promise<Profile>`, `listProfiles(): Promise<Profile[]>`, `setUserRole(id: string, role: "customer" | "admin"): Promise<Profile>` from `server/src/services/profileService.ts`.

- [ ] **Step 1: Write the failing test**

Create `server/src/services/profileService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  getProfileById,
  listProfiles,
  setUserRole,
  updateProfile,
} from "./profileService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {
      "user-token": {
        id: USER_ID,
        email: "jane@example.com",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: USER_ID,
        full_name: "Jane Doe",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: OTHER_ID,
        full_name: "Bob Smith",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("getProfileById", () => {
  it("returns the mapped profile for an existing id", async () => {
    const profile = await getProfileById(USER_ID);
    expect(profile).toEqual({
      id: USER_ID,
      fullName: "Jane Doe",
      phone: null,
      address: null,
      role: "customer",
      createdAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("returns null for an unknown id", async () => {
    const profile = await getProfileById("does-not-exist");
    expect(profile).toBeNull();
  });
});

describe("updateProfile", () => {
  it("updates only the provided fields", async () => {
    const profile = await updateProfile(USER_ID, { phone: "0771234567" });
    expect(profile.phone).toBe("0771234567");
    expect(profile.fullName).toBe("Jane Doe");
  });
});

describe("listProfiles", () => {
  it("returns profiles ordered by created_at descending", async () => {
    const profiles = await listProfiles();
    expect(profiles.map((p) => p.id)).toEqual([USER_ID, OTHER_ID]);
  });
});

describe("setUserRole", () => {
  it("updates both the auth app_metadata role and the profile role", async () => {
    const profile = await setUserRole(USER_ID, "admin");
    expect(profile.role).toBe("admin");

    const fakeClient = getSupabaseAdmin();
    const { data } = await (fakeClient as any).auth.admin.getUserById(USER_ID);
    expect(data.user?.app_metadata.role).toBe("admin");
  });

  it("throws when the target user does not exist in auth", async () => {
    await expect(
      setUserRole("00000000-0000-0000-0000-000000000000", "admin")
    ).rejects.toThrow("User not found");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- profileService
```

Expected: FAIL — `Cannot find module './profileService.js'`.

- [ ] **Step 3: Implement the types**

Create `server/src/types/profile.ts`:

```ts
export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  createdAt: string;
}
```

- [ ] **Step 4: Implement the service**

Create `server/src/services/profileService.ts`:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import type { Profile } from "../types/profile.js";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function updateProfile(
  id: string,
  fields: { fullName?: string; phone?: string; address?: string }
): Promise<Profile> {
  const update: Record<string, string> = {};
  if (fields.fullName !== undefined) update.full_name = fields.fullName;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.address !== undefined) update.address = fields.address;

  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data as ProfileRow);
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(mapProfile);
}

export async function setUserRole(
  id: string,
  role: "customer" | "admin"
): Promise<Profile> {
  const admin = getSupabaseAdmin();

  const { data: userData, error: getUserError } =
    await admin.auth.admin.getUserById(id);
  if (getUserError || !userData.user) {
    throw new Error(`User not found: ${id}`);
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    app_metadata: { ...userData.user.app_metadata, role },
  });
  if (authError) {
    throw new Error(`Failed to update auth role: ${authError.message}`);
  }

  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(
      `Auth role updated to "${role}" but the profiles row update failed: ${error.message}. The profile is now out of sync with app_metadata — retry the role update.`
    );
  }
  return mapProfile(data as ProfileRow);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
cd server
npm run test -- profileService
```

Expected: PASS (6 tests).

- [ ] **Step 6: Stage**

```bash
git add server/src/types/profile.ts server/src/services
```

---

### Task 4: Request validation schemas

**Files:**
- Create: `server/src/validation/userSchemas.ts`
- Test: `server/src/validation/userSchemas.test.ts`

**Interfaces:**
- Produces: `updateProfileSchema` (Zod schema — parses to `{ fullName?: string; phone?: string; address?: string }`, requires at least one field) and `updateRoleSchema` (Zod schema — parses to `{ role: "customer" | "admin" }`) from `server/src/validation/userSchemas.ts`.

- [ ] **Step 1: Write the failing test**

Create `server/src/validation/userSchemas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { updateProfileSchema, updateRoleSchema } from "./userSchemas.js";

describe("updateProfileSchema", () => {
  it("accepts a partial update with one field", () => {
    const result = updateProfileSchema.safeParse({ phone: "0771234567" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty string field", () => {
    const result = updateProfileSchema.safeParse({ fullName: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateRoleSchema", () => {
  it("accepts 'admin' and 'customer'", () => {
    expect(updateRoleSchema.safeParse({ role: "admin" }).success).toBe(true);
    expect(updateRoleSchema.safeParse({ role: "customer" }).success).toBe(true);
  });

  it("rejects any other role value", () => {
    expect(updateRoleSchema.safeParse({ role: "superadmin" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- userSchemas
```

Expected: FAIL — `Cannot find module './userSchemas.js'`.

- [ ] **Step 3: Implement**

Create `server/src/validation/userSchemas.ts`:

```ts
import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().min(1).max(50).optional(),
    address: z.string().trim().min(1).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (fullName, phone, address) is required",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(["customer", "admin"]),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd server
npm run test -- userSchemas
```

Expected: PASS (5 tests).

- [ ] **Step 5: Stage**

```bash
git add server/src/validation
```

---

### Task 5: Users router (`/api/users/me`)

**Files:**
- Create: `server/src/routes/users.ts`
- Test: `server/src/routes/users.test.ts`

**Interfaces:**
- Consumes: `getProfileById`, `updateProfile` from `../services/profileService.js` (Task 3); `updateProfileSchema` from `../validation/userSchemas.js` (Task 4); `requireAuth` from `../middleware/auth.js` (existing).
- Produces: `usersRouter` (an Express `Router`) from `server/src/routes/users.ts`, exposing `GET /users/me` and `PUT /users/me` (mounted under `/api` by `routes/index.ts` in Task 6, so full paths are `/api/users/me`).

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/users.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {
      "customer-token": {
        id: USER_ID,
        email: "jane@example.com",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: USER_ID,
        full_name: "Jane Doe",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/users/me", () => {
  it("returns 401 without a bearer token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("returns the merged profile for an authenticated user", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer customer-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: USER_ID,
      email: "jane@example.com",
      fullName: "Jane Doe",
      phone: null,
      address: null,
      role: "customer",
    });
  });
});

describe("PUT /api/users/me", () => {
  it("returns 400 for an empty body", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", "Bearer customer-token")
      .send({});

    expect(res.status).toBe(400);
  });

  it("updates and returns the profile", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", "Bearer customer-token")
      .send({ phone: "0771234567" });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe("0771234567");
    expect(res.body.fullName).toBe("Jane Doe");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- routes/users
```

Expected: FAIL — either "Cannot find module './users.js'" or 404s from the not-yet-mounted route (`usersRouter` doesn't exist yet, so `../app.js` won't reference it — the import itself fails first since Task 6 hasn't wired it in; that's fine, this test intentionally imports `createApp` which will 404 all these paths until Task 6 mounts `usersRouter`. **This test will keep failing until Task 6 is also done** — that's expected; note it and continue to Step 3, which still needs to happen for Task 6 to have something to mount.)

- [ ] **Step 3: Implement the router**

Create `server/src/routes/users.ts`:

```ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getProfileById, updateProfile } from "../services/profileService.js";
import { updateProfileSchema } from "../validation/userSchemas.js";

export const usersRouter = Router();

usersRouter.get("/users/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await getProfileById(req.user!.id);
    res.json({
      id: req.user!.id,
      email: req.user!.email ?? null,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      address: profile?.address ?? null,
      role: req.user!.role,
    });
  } catch (err) {
    next(err);
  }
});

usersRouter.put("/users/me", requireAuth, async (req, res, next) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request body" },
    });
    return;
  }

  try {
    const profile = await updateProfile(req.user!.id, parsed.data);
    res.json({
      id: req.user!.id,
      email: req.user!.email ?? null,
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      role: req.user!.role,
    });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Confirm the test still fails cleanly (not mounted yet)**

```bash
cd server
npm run test -- routes/users
```

Expected: FAIL with 404s (routes not mounted) — this is expected at this point; it's resolved in Task 6.

- [ ] **Step 5: Stage**

```bash
git add server/src/routes/users.ts server/src/routes/users.test.ts
```

---

### Task 6: Admin router, route wiring, and demo-route cleanup

**Files:**
- Create: `server/src/routes/admin.ts`
- Modify: `server/src/routes/index.ts`
- Test: `server/src/routes/admin.test.ts`

**Interfaces:**
- Consumes: `listProfiles`, `setUserRole` from `../services/profileService.js` (Task 3); `updateRoleSchema` from `../validation/userSchemas.js` (Task 4); `requireAuth`, `requireRole` (existing); `usersRouter` from `./users.js` (Task 5).
- Produces: `adminRouter` (Express `Router`) from `server/src/routes/admin.ts`, exposing `GET /admin/customers` and `PUT /admin/customers/:id/role`. `apiRouter` in `routes/index.ts` now mounts `healthRouter`, `usersRouter`, `adminRouter` — the demo `/api/me` and `/api/admin/ping` routes are gone.

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/admin.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {
      "admin-token": {
        id: ADMIN_ID,
        email: "admin@royalbakery.lk",
        app_metadata: { role: "admin" },
      },
      "customer-token": {
        id: CUSTOMER_ID,
        email: "cust@example.com",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: ADMIN_ID,
        full_name: "Admin User",
        phone: null,
        address: null,
        role: "admin",
        created_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: CUSTOMER_ID,
        full_name: "Regular Customer",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/admin/customers", () => {
  it("returns 401 without a token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/customers");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin token", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/customers")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("returns the customer list for an admin token", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/customers")
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(200);
    expect(res.body.customers).toHaveLength(2);
    expect(res.body.customers[0].id).toBe(ADMIN_ID);
  });
});

describe("PUT /api/admin/customers/:id/role", () => {
  it("promotes a customer to admin", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/customers/${CUSTOMER_ID}/role`)
      .set("Authorization", "Bearer admin-token")
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.customer.role).toBe("admin");
  });

  it("returns 400 for an invalid role value", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/customers/${CUSTOMER_ID}/role`)
      .set("Authorization", "Bearer admin-token")
      .send({ role: "superadmin" });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- routes/admin
```

Expected: FAIL — `Cannot find module './admin.js'`.

- [ ] **Step 3: Implement the admin router**

Create `server/src/routes/admin.ts`:

```ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { listProfiles, setUserRole } from "../services/profileService.js";
import { updateRoleSchema } from "../validation/userSchemas.js";

export const adminRouter = Router();

adminRouter.get(
  "/admin/customers",
  requireAuth,
  requireRole("admin"),
  async (_req, res, next) => {
    try {
      const customers = await listProfiles();
      res.json({ customers });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.put(
  "/admin/customers/:id/role",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { message: parsed.error.issues[0]?.message ?? "Invalid request body" },
      });
      return;
    }

    try {
      const customer = await setUserRole(req.params.id, parsed.data.role);
      res.json({ customer });
    } catch (err) {
      next(err);
    }
  }
);
```

- [ ] **Step 4: Wire everything into `routes/index.ts` and remove the demo routes**

Replace the full contents of `server/src/routes/index.ts` with:

```ts
import { Router } from "express";
import { adminRouter } from "./admin.js";
import { healthRouter } from "./health.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
```

- [ ] **Step 5: Run all tests to confirm everything passes, including Task 5's**

```bash
cd server
npm run test
```

Expected: PASS — every test file (`fakeSupabase`, `profileService`, `userSchemas`, `routes/users`, `routes/admin`) is green.

- [ ] **Step 6: Build check**

```bash
cd server
npm run build
```

Expected: exits 0, no TypeScript errors, `dist/routes/admin.js` and `dist/routes/users.js` exist.

- [ ] **Step 7: Stage**

```bash
git add server/src/routes
```

---

### Task 7: Admin bootstrap script

**Files:**
- Create: `server/scripts/setAdminRole.ts`
- Test: `server/scripts/setAdminRole.test.ts`
- Modify: `server/package.json`

**Interfaces:**
- Consumes: `getSupabaseAdmin` from `../src/lib/supabase.js`; `setUserRole` from `../src/services/profileService.js` (Task 3).
- Produces: `resolveAndPromoteUserByEmail(email: string): Promise<Profile>`, exported from `server/scripts/setAdminRole.ts` for testing, plus a CLI entrypoint runnable as `npm run set-admin -- <email>`.

- [ ] **Step 1: Write the failing test**

Create `server/scripts/setAdminRole.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../src/lib/supabase.js";
import { createFakeSupabaseClient } from "../src/test/fakeSupabase.js";
import { resolveAndPromoteUserByEmail } from "./setAdminRole.js";

const USER_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {
      "owner-token": {
        id: USER_ID,
        email: "owner@royalbakery.lk",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: USER_ID,
        full_name: "Bakery Owner",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("resolveAndPromoteUserByEmail", () => {
  it("promotes the matching user to admin", async () => {
    const profile = await resolveAndPromoteUserByEmail("owner@royalbakery.lk");
    expect(profile.role).toBe("admin");
  });

  it("is case-insensitive on email", async () => {
    const profile = await resolveAndPromoteUserByEmail("OWNER@royalbakery.lk");
    expect(profile.role).toBe("admin");
  });

  it("throws a clear error when no user matches the email", async () => {
    await expect(
      resolveAndPromoteUserByEmail("nobody@royalbakery.lk")
    ).rejects.toThrow('No user found with email "nobody@royalbakery.lk"');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- setAdminRole
```

Expected: FAIL — `Cannot find module './setAdminRole.js'`.

- [ ] **Step 3: Implement the script**

Create `server/scripts/setAdminRole.ts`:

```ts
import { pathToFileURL } from "node:url";
import { getSupabaseAdmin } from "../src/lib/supabase.js";
import { setUserRole } from "../src/services/profileService.js";
import type { Profile } from "../src/types/profile.js";

export async function resolveAndPromoteUserByEmail(
  email: string
): Promise<Profile> {
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers();
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const target = email.toLowerCase();
  const user = data.users.find((u) => u.email?.toLowerCase() === target);
  if (!user) {
    throw new Error(
      `No user found with email "${email}". They must sign up through the app first.`
    );
  }

  return setUserRole(user.id, "admin");
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Usage: tsx scripts/setAdminRole.ts <email>");
    process.exit(1);
  }

  resolveAndPromoteUserByEmail(emailArg)
    .then((profile) => {
      console.log(`Granted admin role to ${emailArg} (profile id: ${profile.id})`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd server
npm run test -- setAdminRole
```

Expected: PASS (3 tests). This also confirms the `isMain` guard doesn't fire under Vitest (no `process.exit` calls, no hung test run).

- [ ] **Step 5: Add the npm script**

Modify `server/package.json` — add to `"scripts"`:

```json
"set-admin": "tsx scripts/setAdminRole.ts",
```

- [ ] **Step 6: Run the full test suite one more time**

```bash
cd server
npm run test
```

Expected: PASS — all test files across Tasks 2–7 are green together.

- [ ] **Step 7: Stage**

```bash
git add server/scripts server/package.json
```

---

### Task 8: Manual end-to-end verification against the live Supabase project

This task has no new source files — it's the Definition-of-Done checklist proving Tasks 1–7 work together against your real Supabase project (from Task 1), not just against the fake client. Run every step; if any expected result doesn't match, stop and report which step failed before considering the module done.

**Files:** none (verification only).

- [ ] **Step 1: Start the API**

```bash
cd server
npm run dev
```

Expected: `Royal Bakery API listening on http://localhost:4000` with no errors (confirms `server/.env` from Task 1 is valid).

- [ ] **Step 2: Create a test user directly in Supabase**

Open the Supabase Dashboard → **Authentication → Users → Add user**. Create one with an email (e.g. `owner@royalbakery.lk`) and a password you'll remember, with "Auto Confirm User" checked.

Then check **Table Editor → profiles** — confirm a row now exists with that user's `id` and `role = customer`. This proves the Task 1 trigger fired.

- [ ] **Step 3: Promote that user to admin**

In a new terminal:

```bash
cd server
npm run set-admin -- owner@royalbakery.lk
```

Expected output: `Granted admin role to owner@royalbakery.lk (profile id: <uuid>)`.

- [ ] **Step 4: Get a real access token for that user**

Using the Bash tool (`curl` works natively there), with `<project-ref>` and `<anon-key>` from Task 1:

```bash
curl -s -X POST "https://<project-ref>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@royalbakery.lk","password":"<the password you set>"}'
```

Copy the `access_token` value from the JSON response.

- [ ] **Step 5: Confirm `/api/users/me` reflects the promotion**

```bash
curl -s http://localhost:4000/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

Expected: JSON with `"role":"admin"`.

- [ ] **Step 6: Confirm `/api/admin/customers` is now reachable**

```bash
curl -s http://localhost:4000/api/admin/customers \
  -H "Authorization: Bearer <access_token>"
```

Expected: `{"customers":[{...}]}` including the profile from Step 2/3.

- [ ] **Step 7: Confirm RLS denies direct anon access**

```bash
curl -s "https://<project-ref>.supabase.co/rest/v1/products" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"
```

Expected: `[]` — PostgREST returns an empty array (not an error) when RLS blocks every row for the `anon` role on a table with RLS enabled and no policies. An empty array here is the correct, expected result, not a bug.

- [ ] **Step 8: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

Module 1 is complete once Steps 2, 3, 5, 6, and 7 all match their expected results.
