# Responsive Verification

Date: 2026-08-11

## Environment and method

- API started from the built server and `GET /api/health` returned `200` with
  `{"status":"ok"}`.
- The production client was built successfully and started on port 3001. Port
  3000 was already owned by an unrelated application, so it was not used for
  this verification.
- `GET /` from the Royal Bakery production client returned `500`. The available
  environment has no `NEXT_PUBLIC_SUPABASE_URL` or
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the shared header creates a server Supabase
  client, so the storefront cannot render without those configured values.
- `GET /api/products` returned `500` because the server has no configured
  `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`. No credentials, catalog rows,
  customer session, or admin session were invented.
- Browser interaction was unavailable: the Browser runtime returned no
  available browser bindings after its documented connection troubleshooting.
  Consequently, rendered viewport checks were not substituted with source
  review or HTTP requests.

## Route availability

The following HTTP route checks were made against the client before rendering
verification. Routes requiring authentication redirected to login as expected;
public/customer status checks against the correct production client are blocked
by the missing public Supabase configuration described above.

| Route family | Paths covered | Result |
| --- | --- | --- |
| Public storefront | `/`, `/products`, `/products/<id>`, `/about` | Production root is blocked by missing public Supabase config; catalog endpoint is also blocked by missing server Supabase config. |
| Authentication | `/login`, `/signup` | Route family identified; rendered interaction blocked because no Browser binding is available. |
| Customer commerce | `/cart`, `/checkout`, `/account`, `/orders`, `/orders/<id>` | Blocked: no customer credentials or test data were configured. |
| Admin dashboard and catalog | `/admin`, product list/new/detail, category list/new/detail | HTTP redirect-to-login observed for unauthenticated admin paths; admin content blocked without an admin session. |
| Admin operations | order list/detail, customers list/detail, reports | HTTP redirect-to-login observed for unauthenticated admin paths; admin content blocked without an admin session. |

## Viewport matrix

`Blocked` means no browser binding was available to set the viewport or inspect
the rendered document. It is deliberately not a passing result.

| Viewport width | Public/auth rendering | Customer rendering | Admin rendering | Document overflow (`scrollWidth` vs `clientWidth`) | Menus, wrapping, images, focus/touch, reduced motion |
| ---: | --- | --- | --- | --- | --- |
| 320 | Blocked | Blocked | Blocked | **Blocked — not observed** | Blocked — not observed |
| 375 | Blocked | Blocked | Blocked | **Blocked — not observed** | Blocked — not observed |
| 430 | Blocked | Blocked | Blocked | **Blocked — not observed** | Blocked — not observed |
| 768 | Blocked | Blocked | Blocked | **Blocked — not observed** | Blocked — not observed |
| 1024 | Blocked | Blocked | Blocked | **Blocked — not observed** | Blocked — not observed |
| 1440 | Blocked | Blocked | Blocked | **Blocked — not observed** | Blocked — not observed |

No claim of “no unintended horizontal overflow” is made at any width: it was
not observable without a browser. Likewise, no visual defect was established,
so no UI source change or regression test was added in this task.

## Automated verification

| Gate | Result |
| --- | --- |
| `client: npm.cmd test` | Passed: 48 files, 152 tests. |
| `client: npm.cmd run lint` | Passed. |
| `client: npm.cmd run build` | Passed after permitting the build to fetch its configured Google Fonts. |
| `server: npm.cmd test` | Passed: 25 files, 184 tests. (The initial sandboxed attempt could not resolve Vitest's config; the unchanged read-only command passed with approved access.) |
| `server: npm.cmd run build` | Passed. |

## Rerun requirements

To complete the blocked browser matrix, provide an available in-app browser
binding plus configured public Supabase client values, server Supabase service
values, and non-invented customer/admin test sessions with representative data.
