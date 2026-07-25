# Royal Bakery Frontend — Storefront + Auth Implementation Plan

Design doc: `docs/superpowers/specs/2026-07-26-frontend-storefront-auth-design.md`

Unlike the backend modules, there's no existing frontend test framework, so this
plan is not TDD-structured — each task is "write the files, then `npm run build`
to confirm it compiles," with a full manual browser walkthrough as the final task.

## Global constraints

- Every new file goes under `client/src/`, following existing conventions (route
  groups, `src/lib`, `.js`-free imports since this is a bundler, not NodeNext ESM).
- Server Components by default; add `"use client"` only where real interactivity
  is needed (none of the in-scope pages need much — forms use Server Actions).
- Catalog reads go through `client/src/lib/api.ts`'s `api<T>()` helper against
  the Express API (`NEXT_PUBLIC_API_URL`), no auth header.
- Auth mutations go through Supabase directly via `client/src/lib/supabase/server.ts`'s
  `createClient()`, never through Express.
- Do not modify `server/` in this module — it's frontend-only.
- Do not run `git commit`/`git push` — stage only, same standing rule as backend work.

---

### Task 1: Theme, fonts, metadata, image config

**Files:** `client/src/app/globals.css`, `client/src/app/layout.tsx`, `client/next.config.ts`

- Replace the default black/white `@theme` block in `globals.css` with the bakery
  palette tokens from the design doc (`--color-cocoa`, `--color-caramel`,
  `--color-honey`, `--color-cream`, etc.), set `body` background to `--color-cream`.
- Add a serif display font (`next/font/google`, e.g. `Fraunces`) alongside the
  existing Geist Sans/Mono in `layout.tsx`; expose both as CSS variables the same
  way Geist already is.
- Update `metadata` in `layout.tsx` (title/description) away from the
  "Create Next App" default.
- Add `images.remotePatterns` to `next.config.ts` for
  `https://*.supabase.co/storage/v1/object/public/**`.
- Verify: `npm run build` succeeds.

### Task 2: Shared UI primitives

**Files:** `client/src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`

Small, typed, Tailwind-styled primitives using the new theme tokens. `Button`
supports `variant` (primary/secondary/ghost) since forms and nav both need it.
No client-side state in these — plain styled wrappers.

### Task 3: Rename `middleware.ts` → `proxy.ts`

**Files:** delete `client/src/middleware.ts`, create `client/src/proxy.ts`

Same body, `export function middleware` → `export function proxy`, same
`config.matcher`. Confirms the deprecation warning from Module 0's build is gone.

### Task 4: Storefront layout (header + footer)

**Files:** `client/src/app/(shop)/layout.tsx`, `client/src/components/Header.tsx`, `client/src/components/Footer.tsx`

- `Header`: logo/wordmark, nav links (Home, Products, About), auth-aware right
  side — reads the session via the Supabase **server** client once in the layout
  (Server Component), passes a plain `{ email } | null` down; shows Sign In/Sign
  Up links when logged out, "Account" link + a sign-out form (posting to the
  `signOut` Server Action) when logged in.
- `Footer`: simple static bakery info/links.
- `(shop)/layout.tsx` composes `Header` + `{children}` + `Footer`.

### Task 5: Home page

**Files:** `client/src/app/(shop)/page.tsx`

Server Component: fetches `GET /categories` and `GET /products` (first ~8) in
parallel (`Promise.all`, per the Next.js parallel-fetching pattern), renders a
hero section, a categories teaser row, and a featured-products grid using
`ProductCard` (Task 6). Empty/error states handled inline (no products yet ≠
a crash).

### Task 6: Product listing page + ProductCard

**Files:** `client/src/app/(shop)/products/page.tsx`, `client/src/components/ProductCard.tsx`, `client/src/components/ProductFilters.tsx`

- `page.tsx` reads `searchParams: Promise<{ category?: string; search?: string }>`
  (Next.js 16 passes `searchParams` as a Promise — must `await` it), passes
  `categoryId`/`search` through to `GET /products`, fetches `GET /categories`
  for the filter control.
- `ProductFilters`: a small client component (needs `onChange`-driven navigation)
  that updates the URL query string via `useRouter`/`usePathname` — the actual
  data stays server-fetched via the resulting navigation, this component only
  edits the URL.
- `ProductCard`: image (via `next/image`, `imageUrl` may be `null` — needs a
  fallback), name, price (formatted as `LKR n,nnn`), category badge, links to
  `/products/[id]`.

### Task 7: Product detail page

**Files:** `client/src/app/(shop)/products/[id]/page.tsx`

Server Component: `params: Promise<{ id: string }>` (must `await`), fetches
`GET /products/:id`; a 404 from the API (unavailable/missing product) renders
Next's `notFound()`. Shows image, name, price, description, stock status,
category — no cart/add-to-cart control (out of scope, no cart backend yet).

### Task 8: About Us page

**Files:** `client/src/app/(shop)/about/page.tsx`

Static content Server Component — bakery story/values copy, no API calls.

### Task 9: Auth layout + Server Actions

**Files:** `client/src/app/(auth)/layout.tsx`, `client/src/app/actions/auth.ts`

- `(auth)/layout.tsx`: centered card chrome, no storefront header/footer.
- `actions/auth.ts` (`"use server"`): `signIn(formData)`, `signUp(formData)`,
  `signOut()` — per the design doc's auth-flow section (sign-up handles the
  session-may-be-null case; sign-in returns a typed error rather than throwing
  for expected failures like wrong password; sign-out redirects to `/`).

### Task 10: Sign In page

**Files:** `client/src/app/(auth)/login/page.tsx` (replace placeholder)

Form posting to `signIn` Server Action (`action` prop), email + password
fields using the Task 2 primitives, inline error display, link to `/signup`.

### Task 11: Sign Up page

**Files:** `client/src/app/(auth)/signup/page.tsx` (new)

Form posting to `signUp` Server Action — name, email, phone, password,
confirm-password (client-side match check is a nice-to-have, not required
since the server action is the real validation boundary), link to `/login`.

### Task 12: Profile / Account page

**Files:** `client/src/app/(shop)/account/page.tsx`, `client/src/app/actions/profile.ts`

- `page.tsx`: Server Component — `supabase.auth.getUser()`, `redirect('/login')`
  if null; `supabase.auth.getSession()` for the access token; `GET /api/users/me`
  with that token; renders fields + an edit form.
- `actions/profile.ts` (`"use server"`): `updateProfile(formData)` — re-derives
  the session token server-side (never trust a client-supplied token), calls
  `PUT /api/users/me`, then `revalidatePath('/account')`.

### Task 13: Full manual verification (Definition of Done)

No new files — this is the checklist proving the module works end-to-end.

1. `cd client && npm run build` — exits 0, no type errors, no deprecated-middleware warning.
2. `cd server && npm run dev` (port 4000) and `cd client && npm run dev` (port 3000), both running.
3. Browser: `/` — loads, shows featured products (or a sane empty state if the
   catalog is empty), categories teaser, no console errors.
4. Browser: `/products` — lists products, category filter and search both
   update the URL and the results; `/products?search=doesnotmatch` shows an
   empty state, not a crash.
5. Browser: `/products/<a real product id>` — shows details; a bogus id shows
   the Next.js not-found page, not a 500.
6. Browser: `/about` — renders.
7. Browser: `/signup` — create a real account; confirm either a redirect to
   `/account` (if auto-confirm is on) or a "check your email" message (if not).
8. Browser: `/login` — sign in with that account (after confirming email if
   needed); wrong password shows an inline error, not a crash.
9. Browser: `/account` while logged in — shows profile data from
   `/api/users/me`; editing a field and saving persists (reload confirms it).
10. Browser: `/account` while logged out (in a private/incognito window) —
    redirects to `/login`.
11. Header: confirms Sign In/Up links when logged out, Account/Sign out when
    logged in; sign-out actually clears the session (Account redirects to
    login afterward).
12. Stop both dev servers.

Module is done once steps 3–11 all match their expected results.
