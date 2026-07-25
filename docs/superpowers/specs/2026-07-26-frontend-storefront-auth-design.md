# Royal Bakery Frontend — Module 1: Storefront + Auth

Status: approved for planning
Date: 2026-07-26
Depends on: `docs/superpowers/specs/2026-07-12-project-scaffold-design.md` (client scaffold), `docs/superpowers/specs/2026-07-24-backend-schema-auth-design.md` (Module 1 — auth/profile API, merged), `docs/superpowers/specs/2026-07-25-catalog-api-design.md` (Module 2 — catalog API, merged)
Reference: `docs/reference/ui-prototype/` (a standalone, non-integrated design/behavior prototype — see caveat below)

## Context

The client scaffold currently has three placeholder pages ("coming soon") and working Supabase Auth wiring (browser client, server client, session-refresh proxy) but no real UI. Two backend modules are merged and live: auth/profile (`/api/users/me`) and the product/category catalog (`/api/categories`, `/api/products`). This module builds the first real frontend slice on top of them.

A prototype exists at `docs/reference/ui-prototype/` (formerly committed at the repo root as `System/`) describing 13 screens with mock business logic. It is **not integrated code** — vanilla TypeScript classes with hardcoded mock data, no Next.js/React/Express/Supabase — and its type shapes diverge from the real backend (e.g. its `Product.id` is a `number`, the real one is a `uuid`; its `UserProfile.role` has three values, the real one has two). Per its own README caveat, it is used here only as: (a) the list of screens/flows, (b) a starting visual palette, (c) rough content/copy ideas — never as a source of truth for data shapes or architecture.

## Scope: which of the 13 prototype screens this module covers

The prototype defines 13 screens (`docs/reference/ui-prototype/data/mockData.ts` → `SYSTEM_SCREENS`). This module builds only the ones fully backed by already-merged APIs:

| Screen | In scope | Backing API |
|---|---|---|
| Home | ✅ | Module 2 (`GET /products`, `GET /categories`) |
| Product listing | ✅ | Module 2 (`GET /products`) |
| Product detail | ✅ | Module 2 (`GET /products/:id`) |
| About Us | ✅ | static content, no API |
| Sign In | ✅ | Supabase Auth (direct) |
| Sign Up | ✅ | Supabase Auth (direct) |
| User Profile | ✅ | Supabase Auth + Module 1 (`GET/PUT /api/users/me`) |
| Cart | ❌ deferred | needs Module 3 (cart/orders) — not built |
| Checkout | ❌ deferred | needs Module 3 + Module 4 (PayHere) |
| Order Tracking | ❌ deferred | needs Module 3 |
| Contact | ❌ deferred | needs Module 5 (inquiries) for real submission |
| User Dashboard | ❌ deferred | order history needs Module 3 |
| Admin Portal / Admin Dashboard | ❌ deferred | separate frontend phase — Module 2's admin routes exist but building the admin UI is its own scope decision |

Out of scope items are **not stubbed with fake data** — no cart icon that does nothing, no checkout button that goes nowhere. If a nav link would point at an unbuilt feature, it's simply not in the nav yet.

## Route structure (Next.js App Router, existing route groups)

```
client/src/app/
  (shop)/
    layout.tsx          — storefront chrome: header nav + footer, wraps all (shop) pages
    page.tsx             — Home (replaces placeholder)
    products/
      page.tsx           — Product listing, reads ?category= & ?search= from searchParams
      [id]/
        page.tsx         — Product detail
    about/
      page.tsx           — About Us (static)
    account/
      page.tsx           — Profile (protected — redirects to /login if unauthenticated)
  (auth)/
    layout.tsx           — centered auth-card chrome, no storefront nav
    login/
      page.tsx           — Sign In (replaces placeholder)
    signup/
      page.tsx           — Sign Up (new)
  layout.tsx              — root layout (existing, gets font/theme updates)
  actions/
    auth.ts               — Server Actions: signIn, signUp, signOut
```

`(admin)/admin/page.tsx` is untouched — still the "coming soon" placeholder, since admin UI is a separate future phase.

## Data fetching

**Catalog (Home, Products, Product Detail):** plain Server Components, `fetch()` directly against the Express API via the existing `api<T>()` helper (`client/src/lib/api.ts`), no auth header (these are Module 2's public routes). Product listing reads `category`/`search` from `searchParams` (Next.js passes these to Server Component `page.tsx` as a prop) and passes them through as query params — filtering happens via navigation (`<Link>`/`router.push` with updated query string), not client-side state, so the page stays a Server Component.

**Auth (Sign In/Up/Out):** Server Actions (`"use server"`) in `client/src/app/actions/auth.ts`, using the existing `createClient()` from `client/src/lib/supabase/server.ts` (already handles cookie-based session storage via `@supabase/ssr`). Forms submit directly to these actions via the `action` prop — no client-side fetch needed, works with JS disabled per Next.js's progressive enhancement.

**Profile:** Server Component reads the current session via the Supabase server client (`supabase.auth.getUser()`; redirects to `/login` if null), extracts the access token via `supabase.auth.getSession()`, and calls `GET /api/users/me` with it as a Bearer token — exercising Module 1's existing endpoint. Editing submits to a Server Action that calls `PUT /api/users/me` with the same token, then revalidates the page.

## Auth flow specifics

- **Sign up** may or may not return an active session immediately, depending on the Supabase project's email-confirmation setting (not something this module controls or assumes). The action checks `data.session`: if present, redirect to `/account`; if null (confirmation email sent), render a "check your email to confirm" message instead of erroring.
- **Sign in** failure (wrong password, unconfirmed email, etc.) re-renders the form with Supabase's error message — no generic "something went wrong."
- **Sign out** is a Server Action triggered from a button in the header nav (only shown when a session exists), redirects to `/`.
- Session state in the header nav (Sign In/Up vs. Account/Sign Out) is read once in `(shop)/layout.tsx` via the Supabase server client — no client-side auth state management needed for this module's scope.

## Visual design

Adapting the prototype's palette (extracted from `docs/reference/ui-prototype/demo.ts`) as the starting point, refined rather than copied literally:

| Token | Hex | Use |
|---|---|---|
| `--color-cocoa` | `#3A1A13` | primary text, dark surfaces |
| `--color-cocoa-dark` | `#230F0A` | hover/pressed dark states |
| `--color-caramel` | `#B67E4B` | primary accent (buttons, links) |
| `--color-caramel-hover` | `#9B6738` | accent hover state |
| `--color-honey` | `#F3C387` | secondary accent, badges |
| `--color-honey-light` | `#FBE3B4` | subtle highlight backgrounds |
| `--color-cream` | `#FFFBEB` | page background |
| `--color-cream-alt` | `#FFFDF7` | card/surface background |
| `--color-border-warm` | `#EADCC9` | borders, dividers |
| `--color-text-muted` | `#785A52` | secondary text |

Defined as Tailwind v4 `@theme` tokens in `globals.css` (replacing the current default black/white Geist theme), so utility classes like `bg-cream`, `text-cocoa`, `border-warm` become available directly.

**Typography:** a warm serif display face for headings (bakery/artisanal feel — evaluated at implementation time between e.g. `Fraunces` or `Playfair Display` via `next/font/google`) paired with a clean sans body face (keep Geist Sans, already wired). Both loaded the same way the scaffold already loads Geist — no new font-loading pattern introduced.

**Components:** a small set of shared primitives in `client/src/components/ui/` (`Button`, `Card`, `Input`, `Badge`) rather than a large design system — enough for consistency across the 7 pages in scope, not speculative coverage for out-of-scope screens.

## Technical cleanup bundled into this module

- **`middleware.ts` → `proxy.ts`**: this Next.js version deprecated `middleware` in favor of `proxy` (same file, renamed export). The existing scaffold's `client/src/middleware.ts` triggers a build-time deprecation warning already noted in the Module 0 verification report. Renamed as part of this module since we're touching auth/session code anyway.
- **`next.config.ts`**: add `images.remotePatterns` for `https://*.supabase.co/storage/v1/object/public/**` so `next/image` can serve Module 2's uploaded product photos with optimization.
- **Root layout metadata**: replace the default "Create Next App" title/description with real Royal Bakery metadata.

## Testing approach

No frontend test framework exists yet in `client/` (no Vitest/RTL), and adding one is out of scope for this module — introducing a testing framework is a bigger decision than this slice warrants. Verification is:

1. `npm run build` in `client/` — type-checks and production-builds every page; this is a real compile-correctness gate given Next.js 16's strict App Router conventions.
2. Manual browser verification (required before this module is considered done, per standard practice for UI work): both dev servers running, walk through every in-scope page and flow for real against the live Supabase project and Express API — sign up, confirm/sign in, browse/search/filter products, view a product detail, view and edit profile, sign out.

Adding component/integration tests for the frontend is an open item for a future decision, not assumed here.

## Open items carried to later phases

- Cart/Checkout/Order Tracking UI — blocked on backend Module 3.
- Contact page with working submission — blocked on backend Module 5.
- Admin dashboard UI — separate scope decision, not part of this module.
- Frontend test tooling (Vitest + React Testing Library or similar) — not introduced here; revisit if the team wants automated frontend coverage going forward.
