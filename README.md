# Royal Bakery

Integrated bakery e-commerce and store management system.

- **`client/`** — Next.js (App Router) + Tailwind CSS + Framer Motion. Customer storefront, admin dashboard (`/admin`), auth pages (`/login`).
- **`server/`** — Express + TypeScript REST API. Supabase (Postgres, Auth, Storage) as the data platform; PayHere for payments (LKR).

## Prerequisites

- Node.js 20+
- npm

## Setup

```powershell
# 1. Install dependencies
cd client; npm install; cd ..
cd server; npm install; cd ..
```

## Run (two terminals)

```powershell
# Terminal 1 — API on http://localhost:4000
cd server; npm run dev

# Terminal 2 — web app on http://localhost:3000
cd client; npm run dev
```

Health check: `Invoke-RestMethod http://localhost:4000/api/health` → `{ status: ok }`

## Product image import

The product image importer reads the source images already tracked in
`System/assets/products` and uses a separate ignored configuration file for each
target. Create `server/.env.local` for local Supabase and
`server/.env.hosted.local` for the hosted Supabase project. Each file contains:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=the-service-role-key-for-this-target
```

Put the real hosted URL and service-role key only in `server/.env.hosted.local`;
do not add them to this repository or its documentation.

Run a dry-run first. It validates the 31 source mappings and target catalog rows
without uploading files or updating product URLs:

```powershell
cd server
npm run images:dry-run -- --target local
```

To make the explicit, write-enabled import, use:

```powershell
npm run images:import -- --target local
```

Use `--target hosted` for the hosted configuration, or `--target all` to run the
two targets independently. Add `--verify` to either command to require every
mapped product URL to end with `/<product-id>/catalog.webp`, return HTTP 200,
and serve `image/webp`. Each selected target prints its own summary report.

### Product image delivery policy

The client currently keeps Next.js image optimization disabled globally. This is
the safe fallback until a real imported Supabase product URL has been verified
through the production `/_next/image` endpoint: the optimizer resolves upstream
hosts and may reject a Supabase origin that resolves through NAT64/private-address
space. Global `unoptimized` delivers each raw source URL; Next emits no responsive
`srcset` variants or `sizes` attribute in this mode. Component `sizes` values are
kept accurate as readiness for a future optimized policy, rather than as an
active source-selection mechanism today. Images remain lazy by default, and only
a genuine initial LCP image receives `preload`.

The image importer supplies the fallback's efficient source assets: square WebP
files capped at 1000px with quality 82 and long-lived CDN caching. `remotePatterns`
are constraints for a future Next optimizer, not a browser-side allowlist for the
current raw-source delivery. The Supabase pattern is derived at build time from
the non-secret `NEXT_PUBLIC_SUPABASE_URL`: it must be the exact HTTPS project URL
and permits only `/storage/v1/object/public/product-images/**`. No Supabase host
is configured if that variable is missing or invalid. Each existing Unsplash
image has its own exact pathname pattern and shares the exact
`?auto=format&fit=crop&w=1400&q=80` query string, so a future optimizer accepts
only the currently used source URLs. When a production runtime returns HTTP 200
with an image content type for an imported URL, this policy can be revisited and
the global fallback removed.

## Test PayHere payments

PayHere's server-to-server payment notification needs a public HTTPS endpoint while the API is running locally.

For the complete Cloudflare Tunnel startup order, sandbox cards, payment walkthrough, and troubleshooting, see [PayHere sandbox payment testing](docs/PAYHERE_TESTING.md).

## Architecture

Three-tier: Next.js presentation layer → Express REST API (JWT auth via Supabase, role-based access) → Supabase Postgres/Auth/Storage. External: PayHere payment gateway, SMTP email. See `docs/superpowers/specs/2026-07-12-project-scaffold-design.md`.
