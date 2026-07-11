# Royal Bakery — Project Scaffold Design

**Date:** 2026-07-12
**Status:** Approved by user
**Scope:** Scaffold only — a working project foundation. No features, no database schema, no PayHere code.

## Context

Royal Bakery is an integrated bakery e-commerce and store management system (three-tier web architecture, per the approved architecture diagram):

- **Presentation:** Next.js + Tailwind CSS + Framer Motion (customer storefront + admin dashboard), deployed to Vercel/Netlify
- **Application:** Node.js + Express REST API with Supabase JWT auth and role-based access control, deployed to Render/Railway
- **Data & platform:** Supabase (PostgreSQL, Auth, Storage)
- **External:** PayHere payment gateway (LKR, Sri Lanka), SMTP email

This document covers only the initial scaffold. Feature work (catalog, cart, orders, payments, inquiries, reports) comes in later specs.

## Decisions

| Decision | Choice |
|---|---|
| Session scope | Scaffold only |
| Repo layout | `client/` + `server/` folders in this repo (no workspaces) |
| Language | TypeScript in both apps |
| Admin dashboard | Same Next.js app, route group under `/admin` |
| Credentials | Placeholder `.env.example` values; user fills in later |
| Scaffold method | `create-next-app` for client; hand-rolled Express + TS server |
| Git | User commits all changes themselves; Claude never commits |

## Repo layout

```
royal-bakery/
├── client/          # Next.js 15 (App Router) + Tailwind + Framer Motion
├── server/          # Express + TypeScript API
├── docs/superpowers/specs/   # design docs
├── .gitignore
└── README.md        # how to run both apps
```

## Frontend (`client/`)

Generated with `create-next-app` (TypeScript, Tailwind, App Router, ESLint), then extended:

**Added dependencies:** `framer-motion`, `@supabase/supabase-js`, `@supabase/ssr`.

**Route groups** (each with one minimal placeholder page proving routing works):

```
src/app/
├── (shop)/            # storefront: home page placeholder
│   └── page.tsx
├── (admin)/admin/     # admin dashboard placeholder
│   └── page.tsx
├── (auth)/login/      # login placeholder
│   └── page.tsx
└── layout.tsx         # root layout
```

**Library code:**

- `src/lib/supabase/client.ts` — browser Supabase client factory
- `src/lib/supabase/server.ts` — server-component Supabase client factory (cookie-based via `@supabase/ssr`)
- `src/lib/api.ts` — typed `fetch` wrapper for the Express API, base URL from `NEXT_PUBLIC_API_URL`
- `middleware.ts` — Supabase session-refresh stub (wiring present; auth enforcement comes with feature work)

## Backend (`server/`)

Hand-rolled Express 5 + TypeScript:

```
server/
├── src/
│   ├── index.ts               # entry: loads env, starts server
│   ├── app.ts                 # Express app: CORS, JSON parsing, routes, error handler
│   ├── config/env.ts          # zod-validated env vars; fails fast with clear message
│   ├── lib/supabase.ts        # Supabase admin client (service-role key, server only)
│   ├── middleware/
│   │   ├── auth.ts            # verifies Supabase JWT from Authorization header, attaches req.user + role
│   │   ├── requireRole.ts     # RBAC guard: requireRole('admin')
│   │   └── errorHandler.ts    # central error → JSON response
│   └── routes/
│       ├── index.ts           # mounts route modules under /api
│       └── health.ts          # GET /api/health → { status: 'ok' }
├── package.json               # dev: tsx watch · build: tsc · start: node dist
├── tsconfig.json
└── .env.example
```

- **Tooling:** `tsx` for dev reload; `tsc` build for production (`npm run build && npm start` on Render/Railway).
- **Auth middleware is functional but only a demo protected route uses it** — the scaffold boundary is "wired, not built."
- **No PayHere code**; only its env vars documented so the config surface is complete.
- **No empty future-route folders** (YAGNI — routes are added with features).

## Environment variables

**`client/.env.example`:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`

**`server/.env.example`** (each var commented with where to obtain it):

- `PORT=4000`
- `CLIENT_ORIGIN=http://localhost:3000` (CORS allowlist)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_MODE=sandbox`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

## Dev workflow

Two terminals: `npm run dev` in `client/` (port 3000) and in `server/` (port 4000). Root README documents setup, env configuration, and run commands.

No test framework in the scaffold; it is added when the first real feature lands.

## Error handling

- Server: central `errorHandler` middleware returns consistent `{ error: { message } }` JSON; `config/env.ts` fails fast at startup on missing/invalid env vars.
- Client: the `api.ts` fetch wrapper throws typed errors on non-2xx responses; page-level handling comes with feature work.

## Definition of done

1. `npm run dev` starts cleanly in both `client/` and `server/`
2. `GET http://localhost:4000/api/health` returns `{ status: 'ok' }`
3. Placeholder pages render at `/`, `/admin`, `/login`
4. `next build` (client) and `tsc` (server) complete without errors
5. Nothing committed — the user reviews and commits
