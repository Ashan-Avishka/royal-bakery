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
`System/assets/products`. For an explicit hosted-only import, keep the hosted
Supabase credentials in the existing ignored `server/.env` file:

```dotenv
SUPABASE_URL=https://your-hosted-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=the-hosted-service-role-key
```

Do not add real credentials to this repository or its documentation. Run the
hosted dry-run first; it validates the 31 source mappings and target catalog rows
without uploading files or updating product URLs:

```powershell
cd server
npm run images:dry-run -- --target hosted
```

To make the explicit, write-enabled hosted import and verify every mapped URL:

```powershell
npm run images:import -- --target hosted --verify
```

Use `--target all` only when you need the two targets to run independently. That
mode requires `server/.env.local` for local Supabase and
`server/.env.hosted.local` for hosted Supabase; each ignored file contains the
same `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` variables. Add `--verify` to
the import command to require every mapped product URL to end with
`/<product-id>/catalog.webp`, return HTTP 200, and serve `image/webp`. Each
selected target prints its own summary report.

### Product image delivery policy

The client uses Next.js image optimization for the imported Supabase product
assets. A production build was verified against a real imported URL through
`/_next/image`: the request returned HTTP 200 with optimized image content.
Component `sizes` values therefore drive responsive source selection. Images
remain lazy by default, and only a genuine initial LCP image receives `preload`.

The image importer supplies efficient source assets: square WebP files capped at
1000px with quality 82 and long-lived CDN caching. `remotePatterns` constrain the
optimizer's permitted upstream sources. The Supabase pattern is derived at build
time from the non-secret `NEXT_PUBLIC_SUPABASE_URL`: it must be the exact HTTPS
project URL and permits only `/storage/v1/object/public/product-images/**`. No Supabase host
is configured if that variable is missing or invalid. Each existing Unsplash
image has its own exact pathname pattern and shares the exact
`?auto=format&fit=crop&w=1400&q=80` query string, so the optimizer accepts only
the currently used source URLs.

## Test PayHere payments

PayHere's server-to-server payment notification needs a public HTTPS endpoint while the API is running locally.

For the complete Cloudflare Tunnel startup order, sandbox cards, payment walkthrough, and troubleshooting, see [PayHere sandbox payment testing](docs/PAYHERE_TESTING.md).

## Architecture

Three-tier: Next.js presentation layer → Express REST API (JWT auth via Supabase, role-based access) → Supabase Postgres/Auth/Storage. External: PayHere payment gateway, SMTP email. See `docs/superpowers/specs/2026-07-12-project-scaffold-design.md`.
