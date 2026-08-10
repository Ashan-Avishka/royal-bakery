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

## Test PayHere payments

PayHere's server-to-server payment notification needs a public HTTPS endpoint while the API is running locally.

For the complete Cloudflare Tunnel startup order, sandbox cards, payment walkthrough, and troubleshooting, see [PayHere sandbox payment testing](docs/PAYHERE_TESTING.md).

## Architecture

Three-tier: Next.js presentation layer → Express REST API (JWT auth via Supabase, role-based access) → Supabase Postgres/Auth/Storage. External: PayHere payment gateway, SMTP email. See `docs/superpowers/specs/2026-07-12-project-scaffold-design.md`.
