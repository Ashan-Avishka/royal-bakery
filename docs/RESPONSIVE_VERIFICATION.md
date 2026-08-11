# Responsive Verification

Date: 2026-08-11

## Status: BLOCKED

This task is blocked, not complete. The Browser runtime's documented discovery
and troubleshooting flow produced no available bindings. No browser fallback,
source-only substitute, or inferred viewport result was used.

The API and production client were rebuilt and started as task-owned background
processes after the cloud Supabase environment was configured. The unrelated
listener already occupying port 3000 was not used. Royal Bakery ran on ports
3001 and 4000; those task-owned processes were stopped after verification.

## Exact HTTP observations

`GET /api/health` and `GET /api/products` returned `200`. The following
requests were made against the Royal Bakery production client on port 3001.
The product-detail request used a real catalog ID. Order/category IDs used the
zero UUID only as syntactically valid unauthenticated probes.

| Sampled path | Exact observed HTTP status | Rendered route result |
| --- | ---: | --- |
| `/` | 200 | Not observed in a browser. |
| `/products` | 200 | Not observed in a browser. |
| `/products/<real-product-id>` | 200 | Real catalog product; not observed in a browser. |
| `/about` | 200 | Not observed in a browser. |
| `/login` | 200 | Not observed in a browser. |
| `/signup` | 200 | Not observed in a browser. |
| `/cart` | 200 | No authenticated empty/populated cart state was observed. |
| `/checkout` | 200 | No authenticated empty/populated checkout state was observed. |
| `/account` | 200 | No authenticated customer state was observed. |
| `/orders` | 200 | No authenticated order data was observed. |
| `/orders/<zero-uuid>` | 200 | Syntactic probe only; no representative order/session. |
| `/admin` | 307 to `/login` | No admin session existed. |
| `/admin/products` | 307 to `/login` | No admin session existed. |
| `/admin/products?selected=<id>` | Not sampled | No representative product ID, admin session, or catalog data existed. |
| `/admin/products/new` | 307 to `/login` | No admin session existed. |
| `/admin/products/<real-product-id>` | 307 to `/login` | No admin session existed. |
| `/admin/categories` | 307 to `/login` | No admin session existed. |
| `/admin/categories/new` | 307 to `/login` | No admin session existed. |
| `/admin/categories/<zero-uuid>` | 307 to `/login` | No admin session existed. |
| `/admin/orders` | 307 to `/login` | No admin session existed. |
| `/admin/orders?selected=<id>` | Not sampled | No representative order ID, admin session, or order data existed. |
| `/admin/orders/<zero-uuid>` | 307 to `/login` | No admin session existed. |
| `/admin/customers` | 307 to `/login` | No admin session existed. |
| `/admin/customers?selected=<zero-uuid>` | 307 to `/login` | No admin session existed. |
| `/admin/reports` | 307 to `/login` | No admin session existed. |

The imported catalog was available during this follow-up check. All 31 product
images had already passed direct HTTP 200 and `image/webp` verification. With
Next optimization enabled, one real imported URL also returned HTTP 200 image
content from `/_next/image`.

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
| `client: npm.cmd test` | Passed: 52 files, 171 tests. |
| `client: npm.cmd run lint` | Passed. |
| `client: npm.cmd run build` | Passed after permitting the build to fetch its configured Google Fonts. |
| `server: npm.cmd test` | Passed: 25 files, 187 tests. |
| `server: npm.cmd run build` | Passed. |

## Requirements to unblock

An available Browser binding is required before any live viewport work can be
performed. The configured cloud catalog now provides representative products.
Authenticated customer/admin sessions plus representative orders, categories,
customers, and empty/populated commerce states are still required for those
route families.
