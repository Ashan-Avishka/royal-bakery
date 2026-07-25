# Royal Bakery Backend — Product & Category Catalog API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Module 2 of the Royal Bakery backend — admin CRUD for products and categories, a Supabase-Storage-backed product image upload flow, and public (unauthenticated) browse endpoints for the storefront — on top of the already-merged Module 1 schema and auth/RBAC middleware.

**Architecture:** A `catalogService.ts` service layer (mirroring `profileService.ts`) maps `categories`/`products` rows to camelCase domain types and throws `AppError`. A new `uploadService.ts` wraps Supabase Storage. Zod schemas in `catalogSchemas.ts` validate all request bodies/params/query strings. Four route files: `categories.ts` and `products.ts` (public, no auth) and `adminCatalog.ts` (admin CRUD + image upload, `requireAuth` + `requireRole("admin")`). The existing `fakeSupabase.ts` test double is generalized from a hardcoded single-table (`profiles`) engine into a generic multi-table in-memory query-builder engine, plus a `.storage` mock — this generalization is Task 1, done and regression-tested before any catalog code exists.

**Tech Stack:** Same as Module 1 — Express 5, TypeScript (NodeNext ESM, `.js` import extensions), Zod 4, `@supabase/supabase-js` 2, Vitest + Supertest. New dependency: `multer` (multipart/form-data parsing for the image upload route).

## Global Constraints

- ESM + NodeNext: every relative import ends in `.js` even for `.ts` source files — matches the existing codebase throughout.
- Error responses are always `{ error: { message: string } }`. **Every** thrown error from a service function must be an `AppError` (`server/src/errors.ts`) with an explicit HTTP status — never a bare `Error`. This module follows `profileService.ts`'s established pattern exactly: `AppError(404, ...)` for not-found (detected via Supabase's `PGRST116` no-rows code on `.single()`), `AppError(500, ..., { cause })` for anything else.
- `products.price` is `numeric(10,2)` in Postgres; `@supabase/supabase-js` returns it as a JS `string` over PostgREST. `catalogService` converts with `Number(row.price)` when reading and writes back a plain JS `number` (not a string) — this keeps `createProductSchema`/`updateProductSchema` simple (`z.number()`, not a numeric-string parser).
- No DB trigger updates `products.updated_at` automatically — `catalogService.updateProduct` sets it explicitly on every write, same "compute it in the API layer" approach Module 1 used for `order_items.subtotal`.
- Do not modify `server/src/middleware/auth.ts`, `requireRole.ts`, `errors.ts`, `middleware/errorHandler.ts`, `services/profileService.ts`, `routes/users.ts`, or `routes/admin.ts` — all already work correctly and are outside this module's scope. The only existing file this plan modifies is `server/src/routes/index.ts` (to mount three new routers) and `server/package.json` (to add `multer`).
- **Do not run `git commit` or `git push`.** Each task's last step is `git add` (staging) only — the user reviews and commits their own changes.
- Task 1 is a refactor of shared test infrastructure (`fakeSupabase.ts`) used by Module 1's already-merged, already-passing tests. Its own last step is running the **entire** test suite (not just the new tests) to confirm zero regressions — this is the highest-risk step in the whole plan.

---

### Task 1: Generalize the fake Supabase client to a multi-table engine + storage mock

**Files:**
- Modify: `server/src/test/fakeSupabase.ts`
- Modify: `server/src/test/fakeSupabase.test.ts`

**Interfaces:**
- Produces: `createFakeSupabaseClient(options: { usersByToken; profiles: FakeProfileRow[]; categories?: FakeCategoryRow[]; products?: FakeProductRow[] })` — same call signature as before, now with two new optional arrays. `.from(table)` supports `"profiles" | "categories" | "products"` with chainable `.select()`, `.eq()` (repeatable), `.ilike()`, `.order()`, `.insert()`, `.update()`, `.delete()`, terminal `.single()` / `.maybeSingle()` / awaiting directly (array result) — the query builder itself is a `PromiseLike`, mirroring how the real `supabase-js` query builder is thenable. `.single()` on zero matching rows resolves `{ data: null, error: { code: "PGRST116", message } }`.
- Produces: `client.storage.from(bucket).upload(path, body, opts)` → `{ data: { path }, error: null }`, and `.getPublicUrl(path)` → `{ data: { publicUrl: "https://fake-storage.test/<bucket>/<path>" } }`.
- Produces (new exported types): `FakeCategoryRow { id; name; description: string | null; is_active: boolean; created_at: string }`, `FakeProductRow { id; category_id: string | null; name; description: string | null; price: string; image_url: string | null; stock_quantity: number; is_available: boolean; created_at: string; updated_at: string }`.

This task has no "write a failing test first" step in the usual sense — it replaces an existing, passing test file. Instead: write the new test file, confirm it fails against the *old* implementation (proves the new tests actually exercise new behavior), then replace the implementation, then confirm both the new file and the **entire existing suite** pass.

- [ ] **Step 1: Replace `server/src/test/fakeSupabase.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { createFakeSupabaseClient } from "./fakeSupabase.js";

describe("createFakeSupabaseClient — profiles (existing behavior)", () => {
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

  it("returns a PGRST116 error from update().eq().select().single() when nothing matches", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });

    const { data, error } = await client
      .from("profiles")
      .update({ full_name: "Nobody" })
      .eq("id", "does-not-exist")
      .select("*")
      .single();

    expect(data).toBeNull();
    expect(error?.code).toBe("PGRST116");
  });
});

describe("createFakeSupabaseClient — generic multi-table support", () => {
  it("supports insert().select().single() generating an id and created_at", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [], categories: [] });

    const { data, error } = await client
      .from("categories")
      .insert({ name: "Cakes", description: null, is_active: true })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe("Cakes");
    expect(typeof data.id).toBe("string");
    expect(typeof data.created_at).toBe("string");
  });

  it("supports repeated .eq() filters narrowing a select", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      products: [
        { id: "1", category_id: "cat-a", name: "A", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "2", category_id: "cat-a", name: "B", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: false, created_at: "t", updated_at: "t" },
        { id: "3", category_id: "cat-b", name: "C", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
      ],
    });

    const { data } = await client
      .from("products")
      .select("*")
      .eq("category_id", "cat-a")
      .eq("is_available", true);

    expect(data.map((p: any) => p.id)).toEqual(["1"]);
  });

  it("supports .ilike() as a case-insensitive substring match", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      products: [
        { id: "1", category_id: null, name: "Chocolate Cake", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "2", category_id: null, name: "Plain Bread", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
      ],
    });

    const { data } = await client.from("products").select("*").ilike("name", "%choc%");
    expect(data.map((p: any) => p.id)).toEqual(["1"]);
  });

  it("supports delete().eq().select().maybeSingle()", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      categories: [
        { id: "cat-1", name: "Cakes", description: null, is_active: true, created_at: "t" },
      ],
    });

    const { data, error } = await client
      .from("categories")
      .delete()
      .eq("id", "cat-1")
      .select("*")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe("cat-1");

    const remaining = await client.from("categories").select("*");
    expect(remaining.data).toHaveLength(0);
  });

  it("throws for an unsupported table name", () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
    expect(() => client.from("not-a-real-table")).toThrow(/unsupported table/);
  });
});

describe("createFakeSupabaseClient — storage mock", () => {
  it("uploads a file and returns a public URL containing the bucket and path", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });

    const { error } = await client.storage
      .from("product-images")
      .upload("prod-1/photo.png", Buffer.from("bytes"), { contentType: "image/png" });
    expect(error).toBeNull();

    const { data } = client.storage.from("product-images").getPublicUrl("prod-1/photo.png");
    expect(data.publicUrl).toContain("product-images");
    expect(data.publicUrl).toContain("prod-1/photo.png");
  });
});
```

- [ ] **Step 2: Run it to confirm the new cases fail against the current implementation**

```bash
cd server
npm run test -- fakeSupabase
```

Expected: the four "profiles (existing behavior)" tests pass (unchanged), but the "generic multi-table support" and "storage mock" describe blocks fail — `categories`/`products` aren't accepted table names yet, and `.storage` doesn't exist yet.

- [ ] **Step 3: Replace `server/src/test/fakeSupabase.ts`**

```ts
import { randomUUID } from "node:crypto";

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

export interface FakeCategoryRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FakeProductRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

type Row = Record<string, any>;

interface FakeSupabaseOptions {
  usersByToken: Record<string, FakeAuthUser>;
  profiles: FakeProfileRow[];
  categories?: FakeCategoryRow[];
  products?: FakeProductRow[];
}

interface FakeResult<T> {
  data: T;
  error: { code?: string; message: string } | null;
}

/** Minimal stand-in for supabase-js's PostgrestFilterBuilder — thenable, chainable. */
class FakeQueryBuilder implements PromiseLike<FakeResult<any>> {
  private filters: Array<(row: Row) => boolean> = [];
  private orderSpec: { column: string; ascending: boolean } | null = null;
  private mutation:
    | { type: "insert"; rows: Row[] }
    | { type: "update"; patch: Row }
    | { type: "delete" }
    | null = null;
  private wantSingle: "single" | "maybeSingle" | null = null;

  constructor(private table: Row[]) {}

  select(_columns?: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  ilike(column: string, pattern: string) {
    const term = pattern.replace(/^%+|%+$/g, "").toLowerCase();
    this.filters.push((row) => String(row[column] ?? "").toLowerCase().includes(term));
    return this;
  }

  order(column: string, opts: { ascending: boolean }) {
    this.orderSpec = { column, ascending: opts.ascending };
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mutation = { type: "insert", rows: Array.isArray(rows) ? rows : [rows] };
    return this;
  }

  update(patch: Row) {
    this.mutation = { type: "update", patch };
    return this;
  }

  delete() {
    this.mutation = { type: "delete" };
    return this;
  }

  single() {
    this.wantSingle = "single";
    return this;
  }

  maybeSingle() {
    this.wantSingle = "maybeSingle";
    return this;
  }

  private matching(): Row[] {
    return this.table.filter((row) => this.filters.every((f) => f(row)));
  }

  private finish(rows: Row[]): FakeResult<any> {
    if (this.wantSingle === "single") {
      if (rows.length === 0) {
        return {
          data: null,
          error: { code: "PGRST116", message: "The result contains 0 rows" },
        };
      }
      return { data: rows[0], error: null };
    }
    if (this.wantSingle === "maybeSingle") {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  private execute(): FakeResult<any> {
    const now = new Date().toISOString();

    if (this.mutation?.type === "insert") {
      const created = this.mutation.rows.map((partial) => {
        const row: Row = { id: randomUUID(), created_at: now, ...partial };
        this.table.push(row);
        return row;
      });
      return this.finish(created);
    }

    if (this.mutation?.type === "update") {
      const targets = this.matching();
      targets.forEach((row) => Object.assign(row, this.mutation!.patch));
      return this.finish(targets);
    }

    if (this.mutation?.type === "delete") {
      const targets = this.matching();
      targets.forEach((row) => {
        const idx = this.table.indexOf(row);
        if (idx !== -1) this.table.splice(idx, 1);
      });
      return this.finish(targets);
    }

    let rows = this.matching();
    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      rows = [...rows].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return ascending ? cmp : -cmp;
      });
    }
    return this.finish(rows);
  }

  then<TResult1 = FakeResult<any>, TResult2 = never>(
    onfulfilled?: ((value: FakeResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

export function createFakeSupabaseClient(options: FakeSupabaseOptions) {
  const { usersByToken } = options;

  const tables: Record<string, Row[]> = {
    profiles: options.profiles,
    categories: options.categories ?? [],
    products: options.products ?? [],
  };

  function from(tableName: string) {
    const table = tables[tableName];
    if (!table) {
      throw new Error(`FakeSupabaseClient: unsupported table "${tableName}"`);
    }
    return {
      select: (columns?: string) => new FakeQueryBuilder(table).select(columns),
      insert: (rows: Row | Row[]) => new FakeQueryBuilder(table).insert(rows),
      update: (patch: Row) => new FakeQueryBuilder(table).update(patch),
      delete: () => new FakeQueryBuilder(table).delete(),
    };
  }

  return {
    from,
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, _body: unknown, _opts?: unknown) {
            return { data: { path }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://fake-storage.test/${bucket}/${path}` } };
          },
        };
      },
    },
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
        async updateUserById(id: string, patch: { app_metadata?: Record<string, unknown> }) {
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

- [ ] **Step 4: Run the new file to confirm it passes**

```bash
cd server
npm run test -- fakeSupabase
```

Expected: PASS — all describe blocks green (profiles behavior unchanged, new multi-table/storage behavior working).

- [ ] **Step 5: Run the entire existing test suite to confirm zero regressions**

```bash
cd server
npm run test
```

Expected: PASS — `profileService.test.ts`, `userSchemas.test.ts`, `routes/users.test.ts`, `routes/admin.test.ts`, and `scripts/setAdminRole.test.ts` (all Module 1 tests) are still green, unmodified, against the generalized engine. If anything here fails, stop and fix the generalization before proceeding — do not touch the Module 1 test files themselves to make them pass.

- [ ] **Step 6: Stage**

```bash
git add server/src/test
```

---

### Task 2: Category types and service functions

**Files:**
- Create: `server/src/types/catalog.ts`
- Create: `server/src/services/catalogService.ts` (categories only in this task; product functions added in Task 3)
- Test: `server/src/services/catalogService.test.ts` (categories only in this task)

**Interfaces:**
- Produces: `Category { id: string; name: string; description: string | null; isActive: boolean; createdAt: string }` from `server/src/types/catalog.ts` (the `Product` interface is also added to this file in this task, for Task 3 to fill in behavior against, but not yet exercised).
- Produces: `listCategories(options: { activeOnly: boolean }): Promise<Category[]>`, `createCategory(fields: { name: string; description?: string }): Promise<Category>`, `updateCategory(id: string, fields: { name?: string; description?: string; isActive?: boolean }): Promise<Category>`, `deleteCategory(id: string): Promise<void>` from `server/src/services/catalogService.ts`.

- [ ] **Step 1: Add the domain types**

Create `server/src/types/catalog.ts`:

```ts
export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `server/src/services/catalogService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "./catalogService.js";

const CAT_A = "11111111-1111-1111-1111-111111111111";
const CAT_B = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    categories: [
      { id: CAT_A, name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
      { id: CAT_B, name: "Discontinued", description: null, is_active: false, created_at: "2026-01-02T00:00:00.000Z" },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("listCategories", () => {
  it("returns all categories sorted by name when activeOnly is false", async () => {
    const categories = await listCategories({ activeOnly: false });
    expect(categories.map((c) => c.name)).toEqual(["Cakes", "Discontinued"]);
  });

  it("filters to active categories only", async () => {
    const categories = await listCategories({ activeOnly: true });
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("Cakes");
  });
});

describe("createCategory / updateCategory / deleteCategory", () => {
  it("creates a category with defaults", async () => {
    const category = await createCategory({ name: "Breads" });
    expect(category.name).toBe("Breads");
    expect(category.isActive).toBe(true);
  });

  it("updates only the provided fields", async () => {
    const category = await updateCategory(CAT_A, { isActive: false });
    expect(category.isActive).toBe(false);
    expect(category.name).toBe("Cakes");
  });

  it("throws a 404 AppError updating an unknown category", async () => {
    await expect(
      updateCategory("99999999-9999-9999-9999-999999999999", { name: "X" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("deletes an existing category", async () => {
    await expect(deleteCategory(CAT_A)).resolves.toBeUndefined();
  });

  it("throws a 404 AppError deleting an unknown category", async () => {
    await expect(
      deleteCategory("99999999-9999-9999-9999-999999999999")
    ).rejects.toMatchObject({ status: 404 });
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd server
npm run test -- catalogService
```

Expected: FAIL — `Cannot find module './catalogService.js'`.

- [ ] **Step 4: Implement the service (categories section)**

Create `server/src/services/catalogService.ts`:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Category } from "../types/catalog.js";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function listCategories(
  options: { activeOnly: boolean } = { activeOnly: false }
): Promise<Category[]> {
  let query = getSupabaseAdmin().from("categories").select("*");
  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new AppError(500, "Failed to list categories", { cause: error });
  return (data as CategoryRow[]).map(mapCategory);
}

export async function createCategory(fields: {
  name: string;
  description?: string;
}): Promise<Category> {
  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .insert({ name: fields.name, description: fields.description ?? null })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new AppError(409, `A category named "${fields.name}" already exists`);
    }
    throw new AppError(500, "Failed to create category", { cause: error });
  }
  return mapCategory(data as CategoryRow);
}

export async function updateCategory(
  id: string,
  fields: { name?: string; description?: string; isActive?: boolean }
): Promise<Category> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.isActive !== undefined) update.is_active = fields.isActive;

  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new AppError(404, "Category not found");
    if (error.code === "23505") {
      throw new AppError(409, `A category named "${fields.name}" already exists`);
    }
    throw new AppError(500, "Failed to update category", { cause: error });
  }
  return mapCategory(data as CategoryRow);
}

export async function deleteCategory(id: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to delete category", { cause: error });
  if (!data) throw new AppError(404, "Category not found");
}
```

Note: the `error.code === "23505"` (Postgres unique-violation) branches are real defensive code for the live database (`categories.name` has a `unique` constraint from Module 1's schema), but the fake client doesn't simulate unique-constraint violations, so this branch isn't exercised by this task's unit tests — it's checked manually in Task 9's live-database verification instead.

- [ ] **Step 5: Run the test to confirm it passes**

```bash
cd server
npm run test -- catalogService
```

Expected: PASS (6 tests).

- [ ] **Step 6: Stage**

```bash
git add server/src/types/catalog.ts server/src/services/catalogService.ts server/src/services/catalogService.test.ts
```

---

### Task 3: Product service functions

**Files:**
- Modify: `server/src/services/catalogService.ts` (add product functions)
- Modify: `server/src/services/catalogService.test.ts` (add product tests)

**Interfaces:**
- Produces (added to the existing `catalogService.ts`): `listProducts(filters: { categoryId?: string; search?: string; availableOnly: boolean }): Promise<Product[]>`, `getProductById(id: string): Promise<Product | null>`, `createProduct(fields): Promise<Product>`, `updateProduct(id: string, fields): Promise<Product>`, `setProductImage(id: string, imageUrl: string): Promise<Product>`, `deleteProduct(id: string): Promise<void>`.

- [ ] **Step 1: Add the failing product tests**

Append to `server/src/services/catalogService.test.ts` (add these imports to the existing import line from `./catalogService.js`, and add a `products` array to the shared `beforeEach` fixture — the full updated file):

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  setProductImage,
  updateCategory,
  updateProduct,
} from "./catalogService.js";

const CAT_A = "11111111-1111-1111-1111-111111111111";
const CAT_B = "22222222-2222-2222-2222-222222222222";
const PROD_A = "33333333-3333-3333-3333-333333333333";
const PROD_B = "44444444-4444-4444-4444-444444444444";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    categories: [
      { id: CAT_A, name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
      { id: CAT_B, name: "Discontinued", description: null, is_active: false, created_at: "2026-01-02T00:00:00.000Z" },
    ],
    products: [
      {
        id: PROD_A,
        category_id: CAT_A,
        name: "Chocolate Cake",
        description: null,
        price: "1500.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: PROD_B,
        category_id: null,
        name: "Butter Cookies",
        description: null,
        price: "250.00",
        image_url: null,
        stock_quantity: 0,
        is_available: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("listCategories", () => {
  it("returns all categories sorted by name when activeOnly is false", async () => {
    const categories = await listCategories({ activeOnly: false });
    expect(categories.map((c) => c.name)).toEqual(["Cakes", "Discontinued"]);
  });

  it("filters to active categories only", async () => {
    const categories = await listCategories({ activeOnly: true });
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("Cakes");
  });
});

describe("createCategory / updateCategory / deleteCategory", () => {
  it("creates a category with defaults", async () => {
    const category = await createCategory({ name: "Breads" });
    expect(category.name).toBe("Breads");
    expect(category.isActive).toBe(true);
  });

  it("updates only the provided fields", async () => {
    const category = await updateCategory(CAT_A, { isActive: false });
    expect(category.isActive).toBe(false);
    expect(category.name).toBe("Cakes");
  });

  it("throws a 404 AppError updating an unknown category", async () => {
    await expect(
      updateCategory("99999999-9999-9999-9999-999999999999", { name: "X" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("deletes an existing category", async () => {
    await expect(deleteCategory(CAT_A)).resolves.toBeUndefined();
  });

  it("throws a 404 AppError deleting an unknown category", async () => {
    await expect(
      deleteCategory("99999999-9999-9999-9999-999999999999")
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("listProducts", () => {
  it("returns only available products when availableOnly is true", async () => {
    const products = await listProducts({ availableOnly: true });
    expect(products.map((p) => p.id)).toEqual([PROD_A]);
  });

  it("returns all products when availableOnly is false", async () => {
    const products = await listProducts({ availableOnly: false });
    expect(products).toHaveLength(2);
  });

  it("filters by categoryId", async () => {
    const products = await listProducts({ availableOnly: false, categoryId: CAT_A });
    expect(products.map((p) => p.id)).toEqual([PROD_A]);
  });

  it("filters by case-insensitive search", async () => {
    const products = await listProducts({ availableOnly: false, search: "cookie" });
    expect(products.map((p) => p.id)).toEqual([PROD_B]);
  });

  it("converts the numeric(10,2) price string to a number", async () => {
    const products = await listProducts({ availableOnly: false });
    const chocolateCake = products.find((p) => p.id === PROD_A)!;
    expect(chocolateCake.price).toBe(1500);
  });
});

describe("getProductById", () => {
  it("returns null for an unknown id", async () => {
    const product = await getProductById("99999999-9999-9999-9999-999999999999");
    expect(product).toBeNull();
  });
});

describe("createProduct / updateProduct / setProductImage / deleteProduct", () => {
  it("creates a product with defaults", async () => {
    const product = await createProduct({ name: "Croissant", price: 380 });
    expect(product.stockQuantity).toBe(0);
    expect(product.isAvailable).toBe(true);
  });

  it("updates only the provided fields", async () => {
    const product = await updateProduct(PROD_A, { stockQuantity: 12 });
    expect(product.stockQuantity).toBe(12);
    expect(product.name).toBe("Chocolate Cake");
  });

  it("throws a 404 AppError updating an unknown product", async () => {
    await expect(
      updateProduct("99999999-9999-9999-9999-999999999999", { stockQuantity: 1 })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("sets the product image", async () => {
    const product = await setProductImage(PROD_A, "https://example.test/img.png");
    expect(product.imageUrl).toBe("https://example.test/img.png");
  });

  it("deletes an existing product", async () => {
    await expect(deleteProduct(PROD_A)).resolves.toBeUndefined();
  });

  it("throws a 404 AppError deleting an unknown product", async () => {
    await expect(
      deleteProduct("99999999-9999-9999-9999-999999999999")
    ).rejects.toMatchObject({ status: 404 });
  });
});
```

- [ ] **Step 2: Run it to confirm the new tests fail**

```bash
cd server
npm run test -- catalogService
```

Expected: FAIL — `listProducts`, `getProductById`, `createProduct`, `updateProduct`, `setProductImage`, `deleteProduct` aren't exported yet (the category tests from Task 2 still pass).

- [ ] **Step 3: Append the product functions to `catalogService.ts`**

Add these imports/types/functions to the existing `server/src/services/catalogService.ts` (add `Product` to the existing type-only import from `../types/catalog.js`):

```ts
import type { Category, Product } from "../types/catalog.js";

interface ProductRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    imageUrl: row.image_url,
    stockQuantity: row.stock_quantity,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(filters: {
  categoryId?: string;
  search?: string;
  availableOnly: boolean;
}): Promise<Product[]> {
  let query = getSupabaseAdmin().from("products").select("*");
  if (filters.availableOnly) query = query.eq("is_available", true);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list products", { cause: error });
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load product", { cause: error });
  return data ? mapProduct(data as ProductRow) : null;
}

export async function createProduct(fields: {
  name: string;
  description?: string;
  price: number;
  categoryId?: string | null;
  stockQuantity?: number;
  isAvailable?: boolean;
}): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({
      name: fields.name,
      description: fields.description ?? null,
      price: fields.price,
      category_id: fields.categoryId ?? null,
      stock_quantity: fields.stockQuantity ?? 0,
      is_available: fields.isAvailable ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new AppError(500, "Failed to create product", { cause: error });
  return mapProduct(data as ProductRow);
}

export async function updateProduct(
  id: string,
  fields: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string | null;
    stockQuantity?: number;
    isAvailable?: boolean;
    imageUrl?: string;
  }
): Promise<Product> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.price !== undefined) update.price = fields.price;
  if (fields.categoryId !== undefined) update.category_id = fields.categoryId;
  if (fields.stockQuantity !== undefined) update.stock_quantity = fields.stockQuantity;
  if (fields.isAvailable !== undefined) update.is_available = fields.isAvailable;
  if (fields.imageUrl !== undefined) update.image_url = fields.imageUrl;

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new AppError(404, "Product not found");
    throw new AppError(500, "Failed to update product", { cause: error });
  }
  return mapProduct(data as ProductRow);
}

export async function setProductImage(id: string, imageUrl: string): Promise<Product> {
  return updateProduct(id, { imageUrl });
}

export async function deleteProduct(id: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to delete product", { cause: error });
  if (!data) throw new AppError(404, "Product not found");
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd server
npm run test -- catalogService
```

Expected: PASS (17 tests total — 6 category + 11 product).

- [ ] **Step 5: Stage**

```bash
git add server/src/services/catalogService.ts server/src/services/catalogService.test.ts
```

---

### Task 4: Upload service (Supabase Storage)

**Files:**
- Create: `server/src/services/uploadService.ts`
- Test: `server/src/services/uploadService.test.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin` (existing); the fake client's `.storage` mock (Task 1).
- Produces: `uploadProductImage(productId: string, file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<string>` (resolves the public URL) from `server/src/services/uploadService.ts`.

- [ ] **Step 1: Write the failing test**

Create `server/src/services/uploadService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { uploadProductImage } from "./uploadService.js";

const PRODUCT_ID = "55555555-5555-5555-5555-555555555555";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("uploadProductImage", () => {
  it("uploads the file and returns a public URL scoped to the product id", async () => {
    const url = await uploadProductImage(PRODUCT_ID, {
      buffer: Buffer.from("fake-image-bytes"),
      mimetype: "image/png",
      originalname: "my photo.png",
    });

    expect(url).toContain("product-images");
    expect(url).toContain(PRODUCT_ID);
  });

  it("sanitizes unsafe characters from the original filename", async () => {
    const url = await uploadProductImage(PRODUCT_ID, {
      buffer: Buffer.from("x"),
      mimetype: "image/jpeg",
      originalname: "a b?c.jpg",
    });

    expect(url).not.toMatch(/[ ?]/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- uploadService
```

Expected: FAIL — `Cannot find module './uploadService.js'`.

- [ ] **Step 3: Implement**

Create `server/src/services/uploadService.ts`:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";

const BUCKET = "product-images";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadProductImage(
  productId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> {
  const path = `${productId}/${Date.now()}-${sanitizeFileName(file.originalname)}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) {
    throw new AppError(500, "Failed to upload product image", { cause: error });
  }

  const { data } = getSupabaseAdmin().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd server
npm run test -- uploadService
```

Expected: PASS (2 tests).

- [ ] **Step 5: Stage**

```bash
git add server/src/services/uploadService.ts server/src/services/uploadService.test.ts
```

---

### Task 5: Validation schemas

**Files:**
- Create: `server/src/validation/catalogSchemas.ts`
- Test: `server/src/validation/catalogSchemas.test.ts`

**Interfaces:**
- Produces: `idParamSchema` (`{ id: string uuid }`), `createCategorySchema`, `updateCategorySchema` (refine: non-empty), `createProductSchema`, `updateProductSchema` (refine: non-empty), `productListQuerySchema` (`{ categoryId?: uuid; search?: string }`) — all from `server/src/validation/catalogSchemas.ts`.

- [ ] **Step 1: Write the failing test**

Create `server/src/validation/catalogSchemas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  createCategorySchema,
  createProductSchema,
  idParamSchema,
  productListQuerySchema,
  updateCategorySchema,
  updateProductSchema,
} from "./catalogSchemas.js";

describe("idParamSchema", () => {
  it("accepts a uuid", () => {
    expect(idParamSchema.safeParse({ id: "11111111-1111-1111-1111-111111111111" }).success).toBe(true);
  });
  it("rejects a non-uuid", () => {
    expect(idParamSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts a name-only body", () => {
    expect(createCategorySchema.safeParse({ name: "Cakes" }).success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(createCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("rejects an empty body", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });
  it("accepts isActive alone", () => {
    expect(updateCategorySchema.safeParse({ isActive: false }).success).toBe(true);
  });
});

describe("createProductSchema", () => {
  it("accepts a minimal valid product", () => {
    expect(createProductSchema.safeParse({ name: "Croissant", price: 380 }).success).toBe(true);
  });
  it("rejects a negative price", () => {
    expect(createProductSchema.safeParse({ name: "X", price: -1 }).success).toBe(false);
  });
  it("rejects a non-integer stockQuantity", () => {
    expect(
      createProductSchema.safeParse({ name: "X", price: 1, stockQuantity: 1.5 }).success
    ).toBe(false);
  });
  it("accepts an explicit null categoryId", () => {
    expect(
      createProductSchema.safeParse({ name: "X", price: 1, categoryId: null }).success
    ).toBe(true);
  });
});

describe("updateProductSchema", () => {
  it("rejects an empty body", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });
});

describe("productListQuerySchema", () => {
  it("accepts no query params", () => {
    expect(productListQuerySchema.safeParse({}).success).toBe(true);
  });
  it("rejects an invalid categoryId", () => {
    expect(productListQuerySchema.safeParse({ categoryId: "nope" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd server
npm run test -- catalogSchemas
```

Expected: FAIL — `Cannot find module './catalogSchemas.js'`.

- [ ] **Step 3: Implement**

Create `server/src/validation/catalogSchemas.ts`:

```ts
import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, description, isActive) is required",
  });
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000).optional(),
  price: z.number().min(0),
  categoryId: z.string().uuid().nullable().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    price: z.number().min(0).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    stockQuantity: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productListQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(200).optional(),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd server
npm run test -- catalogSchemas
```

Expected: PASS (12 tests).

- [ ] **Step 5: Stage**

```bash
git add server/src/validation/catalogSchemas.ts server/src/validation/catalogSchemas.test.ts
```

---

### Task 6: Public routes (`/categories`, `/products`)

**Files:**
- Create: `server/src/routes/categories.ts`
- Create: `server/src/routes/products.ts`
- Test: `server/src/routes/categories.test.ts`
- Test: `server/src/routes/products.test.ts`
- Modify: `server/src/routes/index.ts`

**Interfaces:**
- Consumes: `listCategories`, `listProducts`, `getProductById` (Tasks 2–3); `idParamSchema`, `productListQuerySchema` (Task 5).
- Produces: `categoriesRouter` exposing `GET /categories`; `productsRouter` exposing `GET /products` and `GET /products/:id` — both mounted with **no** auth middleware.

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/categories.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    categories: [
      { id: "1", name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
      { id: "2", name: "Discontinued", description: null, is_active: false, created_at: "2026-01-01T00:00:00.000Z" },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/categories", () => {
  it("returns only active categories, no auth required", async () => {
    const app = createApp();
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].name).toBe("Cakes");
  });
});
```

Create `server/src/routes/products.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const AVAILABLE_ID = "11111111-1111-1111-1111-111111111111";
const UNAVAILABLE_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    products: [
      {
        id: AVAILABLE_ID,
        category_id: null,
        name: "Chocolate Cake",
        description: null,
        price: "1500.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: UNAVAILABLE_ID,
        category_id: null,
        name: "Retired Bread",
        description: null,
        price: "300.00",
        image_url: null,
        stock_quantity: 0,
        is_available: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/products", () => {
  it("returns only available products, no auth required", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Chocolate Cake");
    expect(res.body.products[0].price).toBe(1500);
  });

  it("filters by search", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products?search=choco");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("returns 400 for an invalid categoryId", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products?categoryId=not-a-uuid");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/products/:id", () => {
  it("returns an available product", async () => {
    const app = createApp();
    const res = await request(app).get(`/api/products/${AVAILABLE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.product.id).toBe(AVAILABLE_ID);
  });

  it("returns 404 for an unavailable product", async () => {
    const app = createApp();
    const res = await request(app).get(`/api/products/${UNAVAILABLE_ID}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products/99999999-9999-9999-9999-999999999999");
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd server
npm run test -- routes/categories routes/products
```

Expected: FAIL — modules don't exist yet (and even once created, routes won't be reachable until wired into `routes/index.ts`, same two-step failure pattern Module 1's `users.test.ts` used).

- [ ] **Step 3: Implement the routers**

Create `server/src/routes/categories.ts`:

```ts
import { Router } from "express";
import { listCategories } from "../services/catalogService.js";

export const categoriesRouter = Router();

categoriesRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await listCategories({ activeOnly: true });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});
```

Create `server/src/routes/products.ts`:

```ts
import { Router } from "express";
import { AppError } from "../errors.js";
import { getProductById, listProducts } from "../services/catalogService.js";
import { idParamSchema, productListQuerySchema } from "../validation/catalogSchemas.js";

export const productsRouter = Router();

productsRouter.get("/products", async (req, res, next) => {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid query parameters" },
    });
    return;
  }

  try {
    const products = await listProducts({
      categoryId: parsed.data.categoryId,
      search: parsed.data.search,
      availableOnly: true,
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/products/:id", async (req, res, next) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }

  try {
    const product = await getProductById(parsed.data.id);
    if (!product || !product.isAvailable) {
      next(new AppError(404, "Product not found"));
      return;
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Wire into `routes/index.ts`**

Replace the full contents of `server/src/routes/index.ts` with:

```ts
import { Router } from "express";
import { adminRouter } from "./admin.js";
import { categoriesRouter } from "./categories.js";
import { healthRouter } from "./health.js";
import { productsRouter } from "./products.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
apiRouter.use(categoriesRouter);
apiRouter.use(productsRouter);
```

(`adminCatalogRouter` is added to this file in Task 7, once it exists.)

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
cd server
npm run test -- routes/categories routes/products
```

Expected: PASS (1 + 6 = 7 tests).

- [ ] **Step 6: Run the full suite**

```bash
cd server
npm run test
```

Expected: PASS — everything from Tasks 1–6 plus all of Module 1's tests, green together.

- [ ] **Step 7: Stage**

```bash
git add server/src/routes/categories.ts server/src/routes/products.ts server/src/routes/categories.test.ts server/src/routes/products.test.ts server/src/routes/index.ts
```

---

### Task 7: Admin catalog routes (CRUD + image upload)

**Files:**
- Create: `server/src/routes/adminCatalog.ts`
- Test: `server/src/routes/adminCatalog.test.ts`
- Modify: `server/src/routes/index.ts`
- Modify: `server/package.json` (add `multer`)

**Interfaces:**
- Consumes: all of `catalogService.ts` (Tasks 2–3), `uploadProductImage` (Task 4), all schemas in `catalogSchemas.ts` (Task 5), `requireAuth`/`requireRole` (existing).
- Produces: `adminCatalogRouter` exposing `GET/POST /admin/categories`, `PUT/DELETE /admin/categories/:id`, `GET/POST /admin/products`, `PUT/DELETE /admin/products/:id`, `POST /admin/products/:id/image` — every route gated by `requireAuth` + `requireRole("admin")`.

- [ ] **Step 1: Add the `multer` dependency**

Modify `server/package.json` — add to `"dependencies"`:

```json
"multer": "^2.0.1",
```

Add to `"devDependencies"`:

```json
"@types/multer": "^1.4.12",
```

Then install:

```bash
cd server
npm install
```

If `npm install` reports a version conflict for either package, adjust the version in `package.json` to whatever `npm view multer version` / `npm view @types/multer version` reports as current and re-run `npm install` — the exact patch version isn't load-bearing, only that a `multer@2.x` with working memory-storage + `fileFilter` support ends up installed.

- [ ] **Step 2: Write the failing test**

Create `server/src/routes/adminCatalog.test.ts`:

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
const CATEGORY_ID = "33333333-3333-3333-3333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-4444-444444444444";

function makeClient() {
  return createFakeSupabaseClient({
    usersByToken: {
      "admin-token": { id: ADMIN_ID, email: "admin@royalbakery.lk", app_metadata: { role: "admin" } },
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [],
    categories: [
      { id: CATEGORY_ID, name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
    ],
    products: [
      {
        id: PRODUCT_ID,
        category_id: CATEGORY_ID,
        name: "Chocolate Cake",
        description: null,
        price: "1500.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
});

describe("admin categories", () => {
  it("requires auth", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/categories");
    expect(res.status).toBe(401);
  });

  it("requires the admin role", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("lists all categories for an admin", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
  });

  it("creates a category", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Breads" });
    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe("Breads");
  });

  it("rejects an empty create body", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", "Bearer admin-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 updating an unknown category", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/admin/categories/99999999-9999-9999-9999-999999999999")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Whatever" });
    expect(res.status).toBe(404);
  });

  it("deletes a category", async () => {
    const app = createApp();
    const res = await request(app)
      .delete(`/api/admin/categories/${CATEGORY_ID}`)
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(204);
  });
});

describe("admin products", () => {
  it("lists all products including unavailable ones", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/products")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("creates a product", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Croissant", price: 380 });
    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe("Croissant");
    expect(res.body.product.price).toBe(380);
  });

  it("rejects a negative price", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Bad Product", price: -5 });
    expect(res.status).toBe(400);
  });

  it("updates a product", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/products/${PRODUCT_ID}`)
      .set("Authorization", "Bearer admin-token")
      .send({ stockQuantity: 10 });
    expect(res.status).toBe(200);
    expect(res.body.product.stockQuantity).toBe(10);
  });

  it("returns 404 deleting an unknown product", async () => {
    const app = createApp();
    const res = await request(app)
      .delete("/api/admin/products/99999999-9999-9999-9999-999999999999")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(404);
  });

  it("uploads a product image and sets imageUrl", async () => {
    const app = createApp();
    const res = await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("fake-png-bytes"), "photo.png");

    expect(res.status).toBe(200);
    expect(res.body.product.imageUrl).toContain("product-images");
  });

  it("rejects a non-image upload", async () => {
    const app = createApp();
    const res = await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd server
npm run test -- routes/adminCatalog
```

Expected: FAIL — `Cannot find module './adminCatalog.js'`.

- [ ] **Step 4: Implement the router**

Create `server/src/routes/adminCatalog.ts`:

```ts
import { Router, type Response } from "express";
import multer from "multer";
import type { ZodError } from "zod";
import { AppError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  setProductImage,
  updateCategory,
  updateProduct,
} from "../services/catalogService.js";
import { uploadProductImage } from "../services/uploadService.js";
import {
  createCategorySchema,
  createProductSchema,
  idParamSchema,
  productListQuerySchema,
  updateCategorySchema,
  updateProductSchema,
} from "../validation/catalogSchemas.js";

export const adminCatalogRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new AppError(400, "Only image uploads are allowed"), false);
      return;
    }
    cb(null, true);
  },
});

function respondValidationError(res: Response, error: ZodError) {
  res.status(400).json({ error: { message: error.issues[0]?.message ?? "Invalid request" } });
}

adminCatalogRouter.use(requireAuth, requireRole("admin"));

// ---- Categories ----

adminCatalogRouter.get("/admin/categories", async (_req, res, next) => {
  try {
    res.json({ categories: await listCategories({ activeOnly: false }) });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.post("/admin/categories", async (req, res, next) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const category = await createCategory(parsed.data);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.put("/admin/categories/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid category id" } });
    return;
  }
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const category = await updateCategory(paramsParsed.data.id, parsed.data);
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.delete("/admin/categories/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid category id" } });
    return;
  }

  try {
    await deleteCategory(paramsParsed.data.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---- Products ----

adminCatalogRouter.get("/admin/products", async (req, res, next) => {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const products = await listProducts({
      categoryId: parsed.data.categoryId,
      search: parsed.data.search,
      availableOnly: false,
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.post("/admin/products", async (req, res, next) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const product = await createProduct(parsed.data);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.put("/admin/products/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const product = await updateProduct(paramsParsed.data.id, parsed.data);
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.delete("/admin/products/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }

  try {
    await deleteProduct(paramsParsed.data.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.post(
  "/admin/products/:id/image",
  upload.single("image"),
  async (req, res, next) => {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: { message: "Invalid product id" } });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: { message: "Missing image file" } });
      return;
    }

    try {
      const existing = await getProductById(paramsParsed.data.id);
      if (!existing) {
        next(new AppError(404, "Product not found"));
        return;
      }
      const imageUrl = await uploadProductImage(paramsParsed.data.id, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });
      const product = await setProductImage(paramsParsed.data.id, imageUrl);
      res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);
```

- [ ] **Step 5: Wire into `routes/index.ts`**

Replace the full contents of `server/src/routes/index.ts` with:

```ts
import { Router } from "express";
import { adminRouter } from "./admin.js";
import { adminCatalogRouter } from "./adminCatalog.js";
import { categoriesRouter } from "./categories.js";
import { healthRouter } from "./health.js";
import { productsRouter } from "./products.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
apiRouter.use(categoriesRouter);
apiRouter.use(productsRouter);
apiRouter.use(adminCatalogRouter);
```

- [ ] **Step 6: Run the full test suite**

```bash
cd server
npm run test
```

Expected: PASS — every test file across Tasks 1–7 and all of Module 1's tests, green together.

- [ ] **Step 7: Build check**

```bash
cd server
npm run build
```

Expected: exits 0, no TypeScript errors, `dist/routes/adminCatalog.js`, `dist/routes/categories.js`, `dist/routes/products.js`, `dist/services/catalogService.js`, `dist/services/uploadService.js` all exist.

- [ ] **Step 8: Stage**

```bash
git add server/src/routes/adminCatalog.ts server/src/routes/adminCatalog.test.ts server/src/routes/index.ts server/package.json server/package-lock.json
```

---

### Task 8: Storage bucket migration

**Files:**
- Create: `server/supabase/migrations/<timestamp>_product_images_bucket.sql`

**Interfaces:**
- Produces: a public Supabase Storage bucket named `product-images`, applied to the live project created in Module 1.

- [ ] **Step 1: Generate the migration file**

```bash
cd server
supabase migration new product_images_bucket
```

- [ ] **Step 2: Paste the bucket creation SQL**

Open the newly created file and set its contents to:

```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
```

- [ ] **Step 3: Apply it to the live project**

```bash
cd server
supabase db push
```

Confirm when prompted. Expected: reports the new migration applied successfully.

- [ ] **Step 4: Verify in the dashboard**

Open the Supabase Dashboard → **Storage**. Confirm a bucket named `product-images` exists and shows as **Public**.

- [ ] **Step 5: Stage**

```bash
git add server/supabase
```

---

### Task 9: Manual end-to-end verification against the live Supabase project

No new source files — this is the Definition-of-Done checklist proving Tasks 1–8 work together against the real Supabase project from Module 1 (not just the fake client). Run every step; if a result doesn't match, stop and report which step failed.

**Files:** none (verification only).

- [ ] **Step 1: Start the API**

```bash
cd server
npm run dev
```

Expected: `Royal Bakery API listening on http://localhost:4000`.

- [ ] **Step 2: Get an admin access token**

Reuse the admin account created during Module 1's verification (or promote a fresh one with `npm run set-admin -- <email>`), then get a token the same way Module 1's runbook did:

```bash
curl -s -X POST "https://<project-ref>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin-email>","password":"<password>"}'
```

Copy `access_token` from the response into `$TOKEN` for the following steps.

- [ ] **Step 3: Create a category**

```bash
curl -s -X POST http://localhost:4000/api/admin/categories \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Cakes","description":"Layer and celebration cakes"}'
```

Expected: `201` with a `category` object. Copy its `id` into `$CATEGORY_ID`.

- [ ] **Step 4: Confirm duplicate category names are rejected (`23505` path from Task 2)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/admin/categories \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Cakes"}'
```

Expected: `409` — this is the one code path Task 2's automated tests couldn't exercise (the fake client doesn't simulate unique-constraint violations); this is where it's actually verified.

- [ ] **Step 5: Create a product in that category**

```bash
curl -s -X POST http://localhost:4000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Chocolate Cake\",\"price\":4200,\"categoryId\":\"$CATEGORY_ID\",\"stockQuantity\":3}"
```

Expected: `201` with a `product` object, `imageUrl: null`. Copy its `id` into `$PRODUCT_ID`.

- [ ] **Step 6: Upload a product image**

Using any small local image file:

```bash
curl -s -X POST "http://localhost:4000/api/admin/products/$PRODUCT_ID/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/local/photo.jpg"
```

Expected: `200` with `product.imageUrl` set to a `https://<project-ref>.supabase.co/storage/v1/object/public/product-images/...` URL.

- [ ] **Step 7: Confirm the uploaded image is publicly fetchable**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "<the imageUrl from Step 6>"
```

Expected: `200` — proves the bucket's `public: true` setting (Task 8) actually serves the object without an auth header.

- [ ] **Step 8: Confirm the public storefront routes see the new product**

```bash
curl -s http://localhost:4000/api/products
curl -s "http://localhost:4000/api/products/$PRODUCT_ID"
curl -s http://localhost:4000/api/categories
```

Expected: all three `200`, no `Authorization` header sent, and the new category/product appear in each.

- [ ] **Step 9: Confirm unavailable products are hidden from the public routes**

```bash
curl -s -X PUT "http://localhost:4000/api/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"isAvailable":false}'

curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4000/api/products/$PRODUCT_ID"
curl -s http://localhost:4000/api/products
```

Expected: the direct-id fetch returns `404`; the list no longer includes the product; both continue to succeed via `GET /api/admin/products` with the admin token.

- [ ] **Step 10: Confirm RLS still denies direct anon access to the new tables' data path (unchanged from Module 1, spot-checked here for `products`)**

```bash
curl -s "https://<project-ref>.supabase.co/rest/v1/products" \
  -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>"
```

Expected: `[]` (RLS deny-all, same as Module 1's Step 7).

- [ ] **Step 11: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

Module 2 is complete once Steps 3–10 all match their expected results.
