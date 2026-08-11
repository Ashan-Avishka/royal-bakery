# Responsive Verification

Date: 2026-08-11

## Status: BLOCKED

This task is blocked, not complete. The Browser runtime's documented discovery
and troubleshooting flow produced no available bindings. No browser fallback,
source-only substitute, or inferred viewport result was used.

The API and production client were built and started as task-owned background
processes. The unrelated listener already occupying port 3000 was not used.
The Royal Bakery production client ran on port 3001 and the API on port 4000.
Those task-owned processes have now been stopped; port 3000 was not touched.

## Exact HTTP observations

`GET /api/health` returned `200` with `{"status":"ok"}`. The following
requests were made against the Royal Bakery production client on port 3001.
The `<id>` requests used `00000000-0000-0000-0000-000000000000`, which was
only a syntactically valid probe and not representative route data.

| Sampled path | Exact observed HTTP status | Rendered route result |
| --- | ---: | --- |
| `/` | 500 | Not observed in a browser. |
| `/products` | 500 | Not observed in a browser. |
| `/products/<id>` | 500 | No representative product ID or product data existed. |
| `/about` | 500 | Not observed in a browser. |
| `/login` | 200 | Not observed in a browser. |
| `/signup` | 200 | Not observed in a browser. |
| `/cart` | 500 | No customer session or empty/populated cart data existed. |
| `/checkout` | 500 | No customer session or empty/populated cart data existed. |
| `/account` | 500 | No customer session existed. |
| `/orders` | 500 | No customer session or order data existed. |
| `/orders/<id>` | 500 | No representative order ID, session, or order data existed. |
| `/admin` | 500 | No admin session existed. |
| `/admin/products` | 500 | No admin session or catalog data existed. |
| `/admin/products?selected=<id>` | Not sampled | No representative product ID, admin session, or catalog data existed. |
| `/admin/products/new` | 500 | No admin session existed. |
| `/admin/products/<id>` | 500 | No representative product ID, admin session, or catalog data existed. |
| `/admin/categories` | 500 | No admin session or category data existed. |
| `/admin/categories/new` | 500 | No admin session existed. |
| `/admin/categories/<id>` | 500 | No representative category ID, admin session, or category data existed. |
| `/admin/orders` | 500 | No admin session or order data existed. |
| `/admin/orders?selected=<id>` | Not sampled | No representative order ID, admin session, or order data existed. |
| `/admin/orders/<id>` | 500 | No representative order ID, admin session, or order data existed. |
| `/admin/customers` | 500 | No admin session or customer data existed. |
| `/admin/customers?selected=<id>` | Not sampled | No representative customer ID, admin session, or customer data existed. |
| `/admin/reports` | 500 | No admin session or report data existed. |

`GET /api/products` on port 4000 returned `500`. The available environment had
no configured public Supabase client values or server Supabase service values;
no credentials or data were invented. The observed `500` statuses above are
not treated as successful route checks or authentication redirects.

## Required route and viewport matrix

Every cell is explicitly `BLOCKED`: without a Browser binding, the viewport
could not be set and `scrollWidth`, `clientWidth`, menu operation, wrapping,
image state, focus order, touch target geometry, and reduced-motion behavior
could not be observed. No claim of no-horizontal-overflow is made at any width.

| Required path pattern | 320 | 375 | 430 | 768 | 1024 | 1440 |
| --- | --- | --- | --- | --- | --- |
| `/` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/products` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/products/<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/about` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/login` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/signup` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/cart` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/checkout` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/account` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/orders` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/orders/<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/products` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/products?selected=<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/products/new` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/products/<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/categories` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/categories/new` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/categories/<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/orders` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/orders?selected=<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/orders/<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/customers` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/customers?selected=<id>` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| `/admin/reports` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

## Automated gate evidence

| Gate | Evidence |
| --- | --- |
| `client: npm.cmd test` | Passed: 48 files, 152 tests. |
| `client: npm.cmd run lint` | Passed. |
| `client: npm.cmd run build` | Passed after permitting the build to fetch its configured Google Fonts. |
| `server: npm.cmd test` | Passed: 25 files, 184 tests. The initial sandboxed invocation could not resolve Vitest's config; the unchanged read-only command passed with approved access. |
| `server: npm.cmd run build` | Passed. |

## Requirements to unblock

An available Browser binding is required before any live viewport work can be
performed. To cover data-dependent and authenticated paths, use actual
configured Supabase public/server values plus non-invented representative
product/order/category IDs, customer/admin sessions, and empty/populated test
states.
