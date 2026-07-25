# Royal Bakery Backend — Module 2: Product & Category Catalog API

Status: approved for planning
Date: 2026-07-25
Depends on: `docs/superpowers/specs/2026-07-24-backend-schema-auth-design.md` (Module 1 — `categories`/`products` tables, auth/RBAC middleware, service-layer + AppError conventions already exist and merged to `main`)

## Context

Module 1 created the full database schema (including `categories` and
`products`) and the auth/profile sync layer, but no route reads or writes
either table yet. This module builds the catalog itself: admin CRUD for
products and categories, a product-image upload flow backed by Supabase
Storage, and the public (unauthenticated) browse endpoints the storefront
needs.

Per the module sequence in the Module 1 spec:

1. ~~Database schema + auth/profile sync~~ — done
2. **Product & category catalog API** (this document)
3. Cart & orders API
4. PayHere payment integration
5. Inquiries + admin reporting

## Out of scope for this module

- Cart, orders, payments, inquiries — Modules 3–5.
- Client-side UI (storefront pages, admin product forms) — separate work
  against this API once it exists.
- Pagination on list endpoints (catalog is small; same deferral Module 1
  made for `GET /admin/customers`).
- Per-row RLS policies on `categories`/`products` (deny-all + service-role
  API access continues per Module 1's access-control architecture).
- Multiple images per product — `products.image_url` is a single column;
  a gallery is future work if needed.

## Storage setup

One new piece of infrastructure: a public Supabase Storage bucket for
product images, created via SQL migration (no manual dashboard step,
consistent with the rest of the schema being migration-driven):

```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
```

`public: true` means anyone can read an object by its public URL without
a signed URL or auth header — appropriate for storefront product photos.
Writes still go exclusively through the Express service-role client
(same access-control model as the database tables), so no storage RLS
policies are needed for the write path either.

## Access-control architecture

Unchanged from Module 1: Express is the only writer, always via
`getSupabaseAdmin()` (service-role key, bypasses RLS and storage policies
alike). Route-level authorization is `requireAuth` + `requireRole("admin")`
for every mutating endpoint; browse endpoints are intentionally mounted
with no auth middleware at all.

## Database schema

No new tables and no column changes — `categories` and `products` already
exist exactly as defined in Module 1's `init_schema` migration. This
module only adds the storage-bucket migration above.

## Service layer

`server/src/services/catalogService.ts`, following the
`profileService.ts` pattern: thin functions that call
`getSupabaseAdmin().from(...)`, map snake_case rows to camelCase domain
types, and throw `AppError` (never bare `Error`) — `404` for "not found"
(detected via Supabase's `PGRST116` no-rows code on `.single()`, same
technique `updateProfile` already uses), `500` for anything else.

```ts
interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Product {
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

Functions:
- `listCategories(options: { activeOnly: boolean }): Promise<Category[]>`
- `createCategory(fields): Promise<Category>`
- `updateCategory(id, fields): Promise<Category>` — 404 via `PGRST116`
- `deleteCategory(id): Promise<void>` — products referencing it get
  `category_id = null` via the existing `on delete set null` FK
- `listProducts(filters: { categoryId?: string; search?: string; availableOnly: boolean }): Promise<Product[]>`
- `getProductById(id): Promise<Product | null>` (route decides whether a
  missing/unavailable product is a 404 — see API surface)
- `createProduct(fields): Promise<Product>`
- `updateProduct(id, fields): Promise<Product>` — 404 via `PGRST116`;
  service sets `updated_at` explicitly (no DB trigger exists for it, same
  as Module 1 leaving `order_items.subtotal` to be computed in the API
  layer rather than in SQL)
- `setProductImage(id, imageUrl): Promise<Product>` — thin wrapper around
  `updateProduct(id, { imageUrl })`, called by the upload route
- `deleteProduct(id): Promise<void>`

`price` is `numeric(10,2)` in Postgres, which `@supabase/supabase-js`
returns as a JS `string` (not `number`) over PostgREST. `catalogService`
converts it with `Number(row.price)` when mapping to the domain type, and
converts back to a plain number (not a string) on write — Postgres
accepts a numeric literal fine either way, but keeping the wire format a
`number` in both directions keeps the Zod schemas simple (`z.number()`
rather than a string-that-looks-like-a-number).

## Image upload

`server/src/services/uploadService.ts`:

```ts
async function uploadProductImage(
  productId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> // returns the public URL
```

Implementation: builds a storage path
`${productId}/${Date.now()}-${sanitizedOriginalName}`, calls
`getSupabaseAdmin().storage.from("product-images").upload(path, file.buffer, { contentType: file.mimetype, upsert: false })`,
then `.storage.from("product-images").getPublicUrl(path)` for the URL.
Throws `AppError(500, ...)` on an upload error.

Route: `POST /api/admin/products/:id/image`, `multipart/form-data`, field
name `image`. Uses `multer` (memory storage, 5 MB limit, `image/*`
mimetype filter — reject anything else with a 400 before it reaches
Supabase) to parse the upload into `req.file`. Handler flow: confirm the
product exists (404 if not) → `uploadProductImage` → `setProductImage` →
respond with the updated product. New dependency: `multer` (+
`@types/multer` dev dependency).

## Validation

`server/src/validation/catalogSchemas.ts`, Zod, following
`userSchemas.ts` conventions (trimmed strings, explicit min/max, a
`.refine` requiring at least one field on partial-update schemas,
reusable UUID param schemas):

- `idParamSchema` — `{ id: string uuid }` (generic, replaces the
  catalog-specific need for what `customerIdParamSchema` does for users;
  `userSchemas.ts`'s `customerIdParamSchema` is left as-is, not merged,
  to avoid an unrelated cross-module refactor)
- `createCategorySchema` — `{ name: string (1-100), description?: string (max 1000) }`
- `updateCategorySchema` — partial of the above plus `isActive?: boolean`, refine non-empty
- `createProductSchema` — `{ name: string (1-200), description?: string (max 2000), price: number >= 0, categoryId?: string uuid nullable, stockQuantity?: number int >= 0 default 0, isAvailable?: boolean default true }`
- `updateProductSchema` — same fields, all optional, refine non-empty
- `productListQuerySchema` — `{ categoryId?: string uuid, search?: string (max 200) }` (used by both the public and admin list routes; `availableOnly` is not a query param — it's hardcoded `true` for the public route and `false` — i.e. no filter — for the admin route, decided in the route handler, not by client input)

## Express API surface

Base path `/api`. All JSON in/out except the image upload route
(`multipart/form-data` in, JSON out). Errors as `{ error: { message } }`.

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/categories` | Active categories only (`is_active = true`) |
| `GET` | `/products` | Available products only (`is_available = true`); optional `?categoryId=` and `?search=` query params |
| `GET` | `/products/:id` | Single product; `404` if missing **or** `is_available = false` (an unavailable product doesn't exist as far as the public storefront is concerned) |

### Admin (`requireAuth` + `requireRole("admin")`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/categories` | All categories, including inactive |
| `POST` | `/admin/categories` | Body: `createCategorySchema` |
| `PUT` | `/admin/categories/:id` | Body: `updateCategorySchema` |
| `DELETE` | `/admin/categories/:id` | Deletes the category (referencing products become uncategorized, not deleted) |
| `GET` | `/admin/products` | All products, including unavailable; same `?categoryId=`/`?search=` filters, no availability filter |
| `POST` | `/admin/products` | Body: `createProductSchema` |
| `PUT` | `/admin/products/:id` | Body: `updateProductSchema` |
| `DELETE` | `/admin/products/:id` | Deletes the product (`order_items`/`cart_items` referencing it would `on delete cascade`/`restrict` per Module 1's schema — no such rows exist yet since Modules 3+ aren't built, so this is safe today) |
| `POST` | `/admin/products/:id/image` | `multipart/form-data`, field `image`; uploads to Storage and sets `products.image_url` |

## Testing approach

Fully automated this time — no live-Supabase manual runbook needed, since
this module reads/writes existing tables the same way Module 1's
`profiles` code does, and Module 1 already proved the fake-client testing
strategy works end-to-end.

**Test-infrastructure change:** `server/src/test/fakeSupabase.ts` is
generalized from a hardcoded single `profiles` table to a generic
in-memory multi-table store (`{ profiles: [...], categories: [...],
products: [...] }`), with a query-builder object that supports chained
`.eq()` (repeatable), `.ilike()`, `.order()`, `.insert()`, `.update()`,
`.delete()`, and terminal `.single()` / `.maybeSingle()` / awaiting the
builder directly (mirroring how the real `supabase-js` query builder is
itself thenable). `.single()` on zero matching rows returns an error
shaped `{ code: "PGRST116", message: "..." }` so `catalogService`'s
existing `PGRST116` → 404 mapping (same technique as
`profileService.updateProfile`) works unchanged against the fake client.
A `.storage.from(bucket)` mock is added supporting `.upload()` and
`.getPublicUrl()`.

This is a refactor of shared test infrastructure, so **Task 1 of the
implementation plan is exactly "generalize `fakeSupabase.ts` and confirm
all of Module 1's existing tests still pass unchanged"** before any new
catalog code is written — it's the highest-risk step since a regression
here silently breaks unrelated, already-merged tests.

**New automated coverage:**
- `catalogService` unit tests (category/product CRUD, `PGRST116` → 404,
  price string↔number conversion) against the generalized fake client.
- `uploadService` unit tests against the fake `.storage` mock.
- Route-level Supertest coverage: 401/403 on every admin route without a
  valid/admin token; 400 on invalid bodies; 404 on unknown ids; happy-path
  200s; the public routes' availability filtering (an unavailable product
  404s on `GET /products/:id`, is absent from `GET /products`).

## Open items carried to later modules

- Pagination and sorting options beyond "newest first" — add once catalog
  size warrants it.
- Multiple images per product / a dedicated `product_images` table.
- Bulk stock adjustment / low-stock alerting (mentioned in the project
  proposal's inventory requirements) — revisit once Module 3 (orders)
  exists, since real stock decrementing happens at order-creation time,
  not in this module.
- Category deletion currently has no "are there products in this
  category" guard — deleting a category silently uncategorizes its
  products. Acceptable for now (small admin-only catalog); revisit if
  this becomes a foot-gun in practice.
