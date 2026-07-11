# Royal Bakery Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Royal Bakery monorepo — a Next.js + Tailwind + Framer Motion client and an Express + TypeScript API server wired to Supabase — so both apps run, build, and expose the auth/config surface for future feature work.

**Architecture:** Two independent apps in one repo: `client/` (Next.js App Router with route groups for shop/admin/auth) and `server/` (Express 5 REST API under `/api` with Supabase JWT auth middleware and zod-validated env config). They talk over HTTP; the client's fetch wrapper targets `NEXT_PUBLIC_API_URL`.

**Tech Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS 4), framer-motion, @supabase/supabase-js, @supabase/ssr, Express 5, zod, tsx, dotenv, cors.

## Global Constraints

- **NEVER run `git commit` or `git push`.** The user commits all changes themselves. Where a checkpoint would normally be a commit, stop and report which files are ready instead.
- Scaffold only: no database schema, no PayHere code, no test framework, no real UI — placeholder pages and wired-but-unused middleware are the deliverable (per spec `docs/superpowers/specs/2026-07-12-project-scaffold-design.md`).
- TypeScript in both apps. Client uses `@/*` import alias with `src/` dir. Server uses ESM (`"type": "module"`, NodeNext) — **relative imports in server TS files must end in `.js`**.
- The scaffold must run without real credentials: Supabase/PayHere/SMTP env vars are optional-with-empty-default; code that needs them throws/returns a clear "not configured" error instead of crashing at startup.
- Ports: client 3000, server 4000. Server routes live under `/api`. Error responses are always `{ "error": { "message": string } }`.
- Platform is Windows / PowerShell 5.1 — use the verification commands as written (`Invoke-RestMethod`, `curl.exe`), not bash-isms.
- Working directory is repo root `c:\Users\ashan\Desktop\Projects\royal-bakery` unless a step says otherwise.

---

### Task 1: Repo root files

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: root `.gitignore` covering both apps (later tasks create ignored artifacts like `node_modules/`, `.env`); `README.md` that Task 7 verifies is accurate.

- [ ] **Step 1: Create root `.gitignore`**

```gitignore
# Dependencies
node_modules/

# Builds
client/.next/
client/out/
server/dist/

# Environment
.env
.env.local
.env*.local

# Misc
.DS_Store
*.log
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 2: Create root `README.md`**

````markdown
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

# 2. Configure environment
Copy-Item client/.env.example client/.env.local
Copy-Item server/.env.example server/.env
# then fill in Supabase / PayHere / SMTP values (optional for first run)
```

## Run (two terminals)

```powershell
# Terminal 1 — API on http://localhost:4000
cd server; npm run dev

# Terminal 2 — web app on http://localhost:3000
cd client; npm run dev
```

Health check: `Invoke-RestMethod http://localhost:4000/api/health` → `{ status: ok }`

## Architecture

Three-tier: Next.js presentation layer → Express REST API (JWT auth via Supabase, role-based access) → Supabase Postgres/Auth/Storage. External: PayHere payment gateway, SMTP email. See `docs/superpowers/specs/2026-07-12-project-scaffold-design.md`.
````

- [ ] **Step 3: Verify files exist**

Run: `Get-ChildItem -Name`
Expected: listing includes `.gitignore`, `README.md`, `docs`

- [ ] **Step 4: Checkpoint — report files ready (do NOT commit)**

Report: `.gitignore` and `README.md` created at repo root.

---

### Task 2: Scaffold Next.js client and add dependencies

**Files:**
- Create: `client/` (via create-next-app: `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, Tailwind config, ESLint config, etc.)
- Modify: `client/package.json` (dependency install only)

**Interfaces:**
- Consumes: nothing
- Produces: a running Next.js app on port 3000; installed packages `framer-motion`, `@supabase/supabase-js`, `@supabase/ssr` that Tasks 3–4 import.

- [ ] **Step 1: Generate the app**

Run from repo root:

```powershell
npx --yes create-next-app@latest client --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: exits 0; `client/src/app/page.tsx` and `client/package.json` exist. (If the installed create-next-app version rejects a flag, re-run without that flag and accept the matching prompt default.)

- [ ] **Step 2: Install client dependencies**

```powershell
cd client
npm install framer-motion @supabase/supabase-js @supabase/ssr
```

Expected: exits 0; all three appear under `dependencies` in `client/package.json`.

- [ ] **Step 3: Verify the generated app boots**

```powershell
cd client
npm run dev
```

Expected: "Ready" line with `http://localhost:3000` within ~15s. Then stop the server (Ctrl+C / kill the background task).

- [ ] **Step 4: Checkpoint — report files ready (do NOT commit)**

Report: Next.js app generated in `client/` with framer-motion and Supabase packages installed.

---

### Task 3: Client route groups and placeholder pages

**Files:**
- Create: `client/src/app/(shop)/page.tsx`
- Create: `client/src/app/(admin)/admin/page.tsx`
- Create: `client/src/app/(auth)/login/page.tsx`
- Delete: `client/src/app/page.tsx` (replaced by the `(shop)` home page)

**Interfaces:**
- Consumes: `framer-motion` (installed in Task 2); root layout `client/src/app/layout.tsx` (generated in Task 2, untouched).
- Produces: routes `/`, `/admin`, `/login` that Task 7's verification hits.

- [ ] **Step 1: Delete the generated home page**

```powershell
Remove-Item client/src/app/page.tsx
```

(Route groups can't provide `/` while `src/app/page.tsx` exists — it would be a duplicate-route conflict.)

- [ ] **Step 2: Create `client/src/app/(shop)/page.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold"
      >
        Royal Bakery
      </motion.h1>
      <p className="text-sm opacity-70">Storefront coming soon</p>
    </main>
  );
}
```

(The `motion.h1` intentionally exercises framer-motion so a broken install fails here, not later.)

- [ ] **Step 3: Create `client/src/app/(admin)/admin/page.tsx`**

```tsx
export default function AdminDashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Admin Dashboard — coming soon</h1>
    </main>
  );
}
```

- [ ] **Step 4: Create `client/src/app/(auth)/login/page.tsx`**

```tsx
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Login — coming soon</h1>
    </main>
  );
}
```

- [ ] **Step 5: Verify all three routes render**

Start `npm run dev` in `client/`, then:

```powershell
(Invoke-WebRequest http://localhost:3000/ -UseBasicParsing).StatusCode
(Invoke-WebRequest http://localhost:3000/admin -UseBasicParsing).StatusCode
(Invoke-WebRequest http://localhost:3000/login -UseBasicParsing).StatusCode
```

Expected: `200` three times. Stop the dev server.

- [ ] **Step 6: Checkpoint — report files ready (do NOT commit)**

Report: route groups `(shop)`, `(admin)`, `(auth)` created with placeholder pages at `/`, `/admin`, `/login`.

---

### Task 4: Client Supabase wiring, API helper, middleware, env template

**Files:**
- Create: `client/src/lib/supabase/client.ts`
- Create: `client/src/lib/supabase/server.ts`
- Create: `client/src/lib/api.ts`
- Create: `client/src/middleware.ts`
- Create: `client/.env.example`

**Interfaces:**
- Consumes: `@supabase/ssr` (Task 2); env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.
- Produces: `createClient(): SupabaseClient` (browser, from `@/lib/supabase/client`), `createClient(): Promise<SupabaseClient>` (server, from `@/lib/supabase/server`), `api<T>(path: string, options?: RequestInit): Promise<T>` and `class ApiError extends Error { status: number }` (from `@/lib/api`). Feature work imports these; nothing imports them yet.

- [ ] **Step 1: Create `client/src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create `client/src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore; the
            // middleware handles session refresh.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create `client/src/lib/api.ts`**

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // Non-JSON error body — keep statusText.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 4: Create `client/src/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Scaffold guard: skip session refresh until Supabase is configured.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if expired — required for Server Components.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Note: with `src/`, Next.js expects middleware at `client/src/middleware.ts` (not `client/middleware.ts`).

- [ ] **Step 5: Create `client/.env.example`**

```bash
# Supabase project → Settings → API (https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Express API base URL (server/ runs on 4000 locally)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 6: Verify the client builds**

```powershell
cd client
npm run build
```

Expected: exits 0, "Compiled successfully"; route list shows `/`, `/admin`, `/login`, and `middleware`.

- [ ] **Step 7: Checkpoint — report files ready (do NOT commit)**

Report: Supabase clients, API helper, middleware, and `.env.example` created; `next build` passes.

---

### Task 5: Server package, TypeScript config, and env validation

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/config/env.ts`
- Create: `server/.env.example`

**Interfaces:**
- Consumes: nothing
- Produces: `env` object (from `config/env.js`) with fields `PORT: number`, `CLIENT_ORIGIN: string`, `SUPABASE_URL: string`, `SUPABASE_SERVICE_ROLE_KEY: string`, `SUPABASE_JWT_SECRET: string`, `PAYHERE_MERCHANT_ID: string`, `PAYHERE_MERCHANT_SECRET: string`, `PAYHERE_MODE: "sandbox" | "live"`, `SMTP_HOST: string`, `SMTP_PORT: number`, `SMTP_USER: string`, `SMTP_PASS: string`. Tasks 6 imports `env`; npm scripts `dev`/`build`/`start` defined here.

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "royal-bakery-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

- [ ] **Step 2: Install server dependencies**

```powershell
cd server
npm install express cors zod dotenv @supabase/supabase-js
npm install --save-dev typescript tsx @types/express @types/cors @types/node
```

Expected: exits 0; Express resolves to v5.x (`npm ls express` shows `express@5`).

- [ ] **Step 3: Create `server/tsconfig.json`**

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
  "include": ["src"]
}
```

- [ ] **Step 4: Create `server/src/config/env.ts`**

```ts
import "dotenv/config";
import { z } from "zod";

// Supabase / PayHere / SMTP values default to "" so the scaffold runs
// without credentials; code that needs them must check and fail with a
// clear "not configured" error (see lib/supabase.ts).
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  SUPABASE_JWT_SECRET: z.string().default(""),
  PAYHERE_MERCHANT_ID: z.string().default(""),
  PAYHERE_MERCHANT_SECRET: z.string().default(""),
  PAYHERE_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

- [ ] **Step 5: Create `server/.env.example`**

```bash
# --- Server ---
PORT=4000
# Allowed CORS origin (the Next.js app)
CLIENT_ORIGIN=http://localhost:3000

# --- Supabase (dashboard → Project Settings → API) ---
SUPABASE_URL=
# service_role key — server only, NEVER expose to the client
SUPABASE_SERVICE_ROLE_KEY=
# dashboard → Project Settings → API → JWT Settings
SUPABASE_JWT_SECRET=

# --- PayHere (https://www.payhere.lk → merchant account) ---
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
# sandbox | live
PAYHERE_MODE=sandbox

# --- SMTP (order confirmations / notifications) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

- [ ] **Step 6: Verify env module loads with defaults**

```powershell
cd server
npx tsx -e "import('./src/config/env.ts').then(m => console.log(JSON.stringify(m.env)))"
```

Expected: prints JSON with `"PORT":4000`, `"CLIENT_ORIGIN":"http://localhost:3000"`, `"PAYHERE_MODE":"sandbox"` — no crash despite empty `.env`.

- [ ] **Step 7: Checkpoint — report files ready (do NOT commit)**

Report: server package, tsconfig, env validation, and `.env.example` created; env module loads with defaults.

---

### Task 6: Server app — Supabase client, middleware, routes, entry point

**Files:**
- Create: `server/src/lib/supabase.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/requireRole.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/src/routes/health.ts`
- Create: `server/src/routes/index.ts`
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`

**Interfaces:**
- Consumes: `env` from `../config/env.js` (Task 5); packages from Task 5 Step 2.
- Produces: running API — `GET /api/health` → `200 { "status": "ok" }`; `GET /api/me` → `401` without a valid `Authorization: Bearer <supabase-jwt>` header, `200 { "user": AuthUser }` with one; `GET /api/admin/ping` additionally requires role `admin`. Exports for future features: `requireAuth` (middleware, sets `req.user: AuthUser`), `requireRole(role: string)` (middleware factory), `getSupabaseAdmin(): SupabaseClient`, `AuthUser = { id: string; email?: string; role: string }`.

- [ ] **Step 1: Create `server/src/lib/supabase.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let adminClient: SupabaseClient | null = null;

/**
 * Supabase admin client (service-role key). Server only — bypasses RLS.
 * Throws until SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are configured.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env"
    );
  }
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
```

- [ ] **Step 2: Create `server/src/middleware/auth.ts`**

```ts
import type { NextFunction, Request, Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifies the Supabase JWT from the Authorization header and sets req.user. */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: { message: "Missing bearer token" } });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: { message: "Invalid or expired token" } });
      return;
    }
    req.user = {
      id: data.user.id,
      email: data.user.email ?? undefined,
      role: (data.user.app_metadata?.role as string | undefined) ?? "customer",
    };
    next();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Create `server/src/middleware/requireRole.ts`**

```ts
import type { NextFunction, Request, Response } from "express";

/** RBAC guard — use after requireAuth: router.get(..., requireAuth, requireRole("admin"), handler) */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: { message: "Not authenticated" } });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: { message: "Insufficient permissions" } });
      return;
    }
    next();
  };
}
```

- [ ] **Step 4: Create `server/src/middleware/errorHandler.ts`**

```ts
import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: { message } });
}
```

- [ ] **Step 5: Create `server/src/routes/health.ts`**

```ts
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
```

- [ ] **Step 6: Create `server/src/routes/index.ts`**

```ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { healthRouter } from "./health.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);

// Demo routes proving auth/RBAC wiring — replaced by real features later.
apiRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

apiRouter.get("/admin/ping", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ status: "admin ok" });
});
```

- [ ] **Step 7: Create `server/src/app.ts`**

```ts
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { message: "Not found" } });
  });

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 8: Create `server/src/index.ts`**

```ts
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Royal Bakery API listening on http://localhost:${env.PORT}`);
});
```

- [ ] **Step 9: Verify the API runs and auth wiring rejects correctly**

Start the server (background task): `cd server; npm run dev` — expect the "listening on http://localhost:4000" log. Then:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
# Expected: status = ok

curl.exe -s -o NUL -w "%{http_code}" http://localhost:4000/api/me
# Expected: 401  (missing bearer token)

curl.exe -s -o NUL -w "%{http_code}" http://localhost:4000/api/nope
# Expected: 404
```

Note: `/api/me` WITH a token returns 500 ("Supabase is not configured") until real credentials exist — that is correct scaffold behavior; only the 401 path is verified here. Stop the server.

- [ ] **Step 10: Verify the production build compiles**

```powershell
cd server
npm run build
```

Expected: exits 0; `server/dist/index.js` exists.

- [ ] **Step 11: Checkpoint — report files ready (do NOT commit)**

Report: Express app complete — health, demo auth routes, middleware, error handler; dev server verified, `tsc` build passes.

---

### Task 7: Full verification pass (definition of done)

**Files:**
- Modify: none (verification only; fix regressions in the files above if any check fails)

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces: confirmation the spec's definition of done holds.

- [ ] **Step 1: Fresh boot of both apps**

Start `cd server; npm run dev` and `cd client; npm run dev` as background tasks.
Expected: server logs "listening on http://localhost:4000"; client logs "Ready" on 3000.

- [ ] **Step 2: Run the full check matrix**

```powershell
Invoke-RestMethod http://localhost:4000/api/health                                  # status = ok
(Invoke-WebRequest http://localhost:3000/ -UseBasicParsing).StatusCode              # 200
(Invoke-WebRequest http://localhost:3000/admin -UseBasicParsing).StatusCode         # 200
(Invoke-WebRequest http://localhost:3000/login -UseBasicParsing).StatusCode         # 200
curl.exe -s -o NUL -w "%{http_code}" http://localhost:4000/api/me                   # 401
```

Expected: values in comments. Stop both servers.

- [ ] **Step 3: Both production builds pass**

```powershell
cd client; npm run build   # exits 0
cd ..\server; npm run build  # exits 0
```

- [ ] **Step 4: Confirm nothing is committed and report**

Run: `git status --short` — expect all new files untracked/modified, no new commits (`git log --oneline` unchanged).
Report the full file list to the user as ready for their review and commit.
