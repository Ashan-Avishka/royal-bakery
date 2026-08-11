# Full Client Responsive Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Royal Bakery storefront, auth, customer, and admin route polished and usable from 320 pixels through large desktops while reducing image, JavaScript, motion, and layout costs.

**Architecture:** Establish shared responsive primitives in global CSS and core UI components, then migrate the active shell and route groups in independently testable slices. Keep server-component data boundaries unchanged; isolate only interactive navigation and controls in client components. Finish with current Next.js image configuration checks and route-level browser verification.

**Tech Stack:** Next.js 16.2, React 19.2, Tailwind CSS 4, Framer Motion 12, Vitest, Testing Library

## Global Constraints

- Preserve the existing cocoa, caramel, honey, cream, Fraunces, and Geist identity.
- Support 320, 375, 430, 768, 1024, and desktop widths.
- No unintended page-level horizontal scrolling, overlap, clipped text, or inaccessible controls.
- Use at least 16-pixel text for mobile text-entry controls and practical 44-by-44-pixel touch targets.
- Keep image geometry stable and priority-load only a genuine initial LCP image.
- Keep data fetching and sensitive logic in existing server boundaries.
- Motion must use transform/opacity, work without execution, and respect reduced motion.
- Preserve existing commerce, authentication, and admin behavior.

---

## File Structure

- `client/src/app/globals.css`: responsive tokens, safe areas, text wrapping, touch, and reduced-motion foundation.
- `client/src/components/ui/{Button,Input,DetailPanel}.tsx`: shared control and panel behavior.
- `client/src/components/SiteNav.tsx`: the active storefront desktop/mobile navigation.
- `client/src/components/admin/AdminNav.tsx` and `client/src/app/(admin)/layout.tsx`: responsive admin shell.
- `client/src/components/home/*.tsx`, `ProductCard.tsx`, and shop routes: responsive storefront and media behavior.
- `client/src/app/(auth)/*`, commerce components, and customer routes: narrow-screen forms and task flows.
- `client/src/app/(admin)/admin/**/*` and admin components: mobile lists, detail views, filters, forms, and reports.
- `client/next.config.ts`: conditional verified image optimization policy.
- Existing colocated `*.test.tsx` files plus new shell tests: behavior and responsive-class regressions.

### Task 1: Establish responsive foundations and shared controls

**Files:**
- Modify: `client/src/app/globals.css`
- Modify: `client/src/components/ui/Button.tsx`
- Modify: `client/src/components/ui/Button.test.tsx`
- Modify: `client/src/components/ui/Input.tsx`
- Modify: `client/src/components/ui/Input.test.tsx`
- Modify: `client/src/components/ui/DetailPanel.tsx`
- Modify: `client/src/components/ui/DetailPanel.test.tsx`
- Modify: `client/src/components/PageHeader.tsx`
- Modify: `client/src/components/storefront/SectionHeading.tsx`

**Interfaces:**
- Produces CSS utilities: `.page-container`, `.page-section`, `.surface-pad`, `.safe-x`, `.touch-target`, `.break-anywhere`
- Preserves existing `Button`, `Input`, `DetailPanel`, `PageHeader`, and `SectionHeading` props.

- [ ] **Step 1: Add failing shared-component expectations**

Extend the existing tests to require:

```ts
expect(screen.getByRole("button")).toHaveClass("min-h-11");
expect(screen.getByLabelText("Email")).toHaveClass("text-base", "sm:text-sm");
expect(screen.getByRole("link", { name: "Back to list" })).toHaveClass("min-h-11");
```

Add a PageHeader test that renders a long title and requires `break-words` and a
stacked mobile action container.

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `cd client && npm test -- src/components/ui/Button.test.tsx src/components/ui/Input.test.tsx src/components/ui/DetailPanel.test.tsx`

Expected: FAIL on missing responsive classes.

- [ ] **Step 3: Implement the global foundation and component classes**

Add utilities with mobile defaults and safe areas:

```css
@layer utilities {
  .page-container { width: 100%; max-width: 72rem; margin-inline: auto; padding-inline: 1rem; }
  .page-section { padding-block: 3rem; }
  .surface-pad { padding: 1rem; }
  .safe-x { padding-left: max(1rem, env(safe-area-inset-left)); padding-right: max(1rem, env(safe-area-inset-right)); }
  .touch-target { min-width: 2.75rem; min-height: 2.75rem; }
  .break-anywhere { overflow-wrap: anywhere; }
}

@media (min-width: 40rem) {
  @layer utilities {
    .page-container { padding-inline: 1.5rem; }
    .page-section { padding-block: 5rem; }
    .surface-pad { padding: 1.75rem; }
  }
}
```

Remove duplicate `html` and `::selection` blocks already present in
`globals.css`. Add `min-width: 0` protection to flexible content and keep
`overflow-x: hidden` from masking component-level overflow defects.

- [ ] **Step 4: Run focused tests and lint**

Run: `cd client && npm test -- src/components/ui/Button.test.tsx src/components/ui/Input.test.tsx src/components/ui/DetailPanel.test.tsx`

Run: `cd client && npm run lint`

Expected: focused tests PASS and lint exits 0.

- [ ] **Step 5: Commit responsive primitives**

```bash
git add client/src/app/globals.css client/src/components/ui client/src/components/PageHeader.tsx client/src/components/storefront/SectionHeading.tsx
git commit -m "style(ui): add mobile responsive foundations"
```

### Task 2: Replace the active storefront shell with accessible mobile navigation

**Files:**
- Modify: `client/src/components/SiteNav.tsx`
- Create: `client/src/components/SiteNav.test.tsx`
- Modify: `client/src/components/MainShell.tsx`
- Modify: `client/src/components/Footer.tsx`
- Modify: `client/src/components/Footer.test.tsx`
- Delete after confirming no imports: `client/src/components/storefront/StorefrontHeader.tsx`
- Delete after confirming no imports: `client/src/components/storefront/StorefrontHeader.test.tsx`
- Delete after confirming no imports: `client/src/components/storefront/StorefrontHeader.reduced-motion.test.tsx`

**Interfaces:**
- Preserves `SiteNav({ isSignedIn, isAdmin, cartItemCount })`.
- Produces a menu button with `aria-controls="site-mobile-navigation"` and accurate `aria-expanded`.

- [ ] **Step 1: Write failing navigation behavior tests**

```ts
it("opens and closes the mobile menu with equivalent navigation", async () => {
  const user = userEvent.setup();
  render(<SiteNav isSignedIn={false} cartItemCount={0} />);
  const trigger = screen.getByRole("button", { name: "Open navigation" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  expect(screen.getAllByRole("link", { name: "Menu" })).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Close navigation" }));
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});
```

Add signed-in and admin cases that assert cart, orders, account, dashboard, and
sign-out availability without duplicating interactive labels in the same visible
menu state.

- [ ] **Step 2: Run the shell tests and confirm failure**

Run: `cd client && npm test -- src/components/SiteNav.test.tsx src/components/Footer.test.tsx`

Expected: FAIL because SiteNav has no mobile menu trigger.

- [ ] **Step 3: Implement mobile navigation and safe shell spacing**

Use a button visible below `md`, an `AnimatePresence` menu with inert hidden
content, route-change close behavior, Escape close behavior, and reduced-motion
offset of zero. Keep the cart accessible in the compact header. Use safe-area
padding and a fixed header height token so `MainShell` does not rely on mismatched
magic values.

The state and close behavior must follow this shape:

```tsx
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const pathname = usePathname();

useEffect(() => setMobileMenuOpen(false), [pathname]);
useEffect(() => {
  if (!mobileMenuOpen) return;
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") setMobileMenuOpen(false);
  };
  window.addEventListener("keydown", closeOnEscape);
  return () => window.removeEventListener("keydown", closeOnEscape);
}, [mobileMenuOpen]);
```

The trigger must be:

```tsx
<button
  type="button"
  className="touch-target inline-flex items-center justify-center md:hidden"
  aria-controls="site-mobile-navigation"
  aria-expanded={mobileMenuOpen}
  aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
  onClick={() => setMobileMenuOpen((open) => !open)}
>
  {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
</button>
```

- [ ] **Step 4: Remove the unused StorefrontHeader implementation**

Run: `rg -n "StorefrontHeader" client/src -g '*.tsx'`

Expected before deletion: only the component and its tests. Delete those files,
then rerun the command and expect no matches.

- [ ] **Step 5: Run shell tests and commit**

Run: `cd client && npm test -- src/components/SiteNav.test.tsx src/components/Footer.test.tsx`

Expected: PASS.

```bash
git add client/src/components/SiteNav.tsx client/src/components/SiteNav.test.tsx client/src/components/MainShell.tsx client/src/components/Footer.tsx client/src/components/Footer.test.tsx client/src/components/storefront
git commit -m "feat(storefront): add accessible mobile shell"
```

### Task 3: Optimize product cards and home-page media

**Files:**
- Modify: `client/src/components/ProductCard.tsx`
- Modify: `client/src/components/ProductCard.test.tsx`
- Modify: `client/src/components/home/HeroCarousel.tsx`
- Modify: `client/src/components/home/AutoCarousel.tsx`
- Modify: `client/src/components/home/Carousel.tsx`
- Modify: `client/src/components/home/CategoryShowcase.tsx`
- Modify: `client/src/components/home/ProductCarousel.tsx`
- Modify: `client/src/components/home/PromoBanner.tsx`
- Modify: `client/src/components/home/TrustBar.tsx`
- Modify: `client/src/components/home/AboutTeaser.tsx`
- Modify: `client/src/components/home/HowItWorks.tsx`
- Modify: `client/src/components/home/NewsletterCta.tsx`
- Modify: `client/src/components/home/Testimonials.tsx`
- Modify: `client/src/app/(shop)/page.test.tsx`

**Interfaces:**
- Produces `ProductCard({ product, priority = false }: { product: Product; priority?: boolean })`.
- Preserves carousel keyboard controls and reduced-motion behavior.

- [ ] **Step 1: Add failing image and touch-behavior tests**

Require a priority prop that reaches the product image, a grid-accurate `sizes`
value, a 44-pixel wishlist target, visible non-hover product actions, and only the
first hero slide marked priority. Update the home-page expectation from three
priority product images to zero unless a product image is the measured LCP.

- [ ] **Step 2: Run product and home tests and confirm failure**

Run: `cd client && npm test -- src/components/ProductCard.test.tsx 'src/app/(shop)/page.test.tsx'`

Expected: FAIL on priority signature, target sizing, or excessive priority images.

- [ ] **Step 3: Reduce repeated client work in ProductCard**

Remove React `hovered` state and hover-driven `motion.article` animation. Use CSS
`group-hover` only inside `@media (hover: hover) and (pointer: fine)`, preserve the
localStorage wishlist behavior, keep actions visible on touch, and pass
`priority={priority}` plus accurate grid sizes to `Image`.

Use this public signature and image configuration:

```tsx
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <article className="product-card group relative h-full">
      <Image
        src={product.imageUrl!}
        alt={product.name}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 264px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 2rem)"
        className="object-cover transition-transform duration-500 motion-reduce:transition-none"
      />
    </article>
  );
}
```

Add the fine-pointer enhancement in `globals.css`:

```css
@media (hover: hover) and (pointer: fine) {
  .product-card:hover img { transform: scale(1.04); }
}
```

- [ ] **Step 4: Adapt home compositions for narrow and touch screens**

Use 1rem mobile gutters, smaller bounded hero heights, one-column trust content
at 320px where two columns squeeze copy, touch-safe carousel controls, and reduced
blur/shadow layers under coarse pointer or reduced motion. Ensure carousels expose
their scrollable purpose and retain keyboard navigation.

- [ ] **Step 5: Run home tests and commit**

Run: `cd client && npm test -- src/components/ProductCard.test.tsx 'src/app/(shop)/page.test.tsx' src/components/motion/MotionPrimitives.test.tsx`

Expected: PASS.

```bash
git add client/src/components/ProductCard.tsx client/src/components/ProductCard.test.tsx client/src/components/home 'client/src/app/(shop)/page.test.tsx'
git commit -m "perf(storefront): optimize responsive product media"
```

### Task 4: Adapt catalog, product, cart, checkout, auth, account, and orders

**Files:**
- Modify: `client/src/app/(shop)/products/page.tsx`
- Modify: `client/src/app/(shop)/products/[id]/page.tsx`
- Modify: `client/src/app/(shop)/cart/page.tsx`
- Modify: `client/src/app/(shop)/checkout/page.tsx`
- Modify: `client/src/app/(shop)/account/page.tsx`
- Modify: `client/src/app/(shop)/orders/page.tsx`
- Modify: `client/src/app/(shop)/orders/[id]/page.tsx`
- Modify: `client/src/app/(shop)/about/page.tsx`
- Modify: `client/src/app/(auth)/layout.tsx`
- Modify: `client/src/app/(auth)/login/page.tsx`
- Modify: `client/src/app/(auth)/signup/page.tsx`
- Modify: `client/src/components/ProductFilters.tsx`
- Modify: `client/src/components/CartItemRow.tsx`
- Modify: `client/src/components/CartItemRow.test.tsx`
- Modify: `client/src/components/CheckoutForm.tsx`
- Modify: `client/src/components/AccountForm.tsx`
- Modify: relevant existing shop page tests

**Interfaces:**
- Preserves all actions, query parameters, redirects, and server fetch calls.
- Consumes responsive primitives from Task 1 and ProductCard from Task 3.

- [ ] **Step 1: Add failing narrow-layout assertions**

Add exact assertions for a one-column 320px catalog default, full-width mobile
filters, cart rows whose forms and totals stack below product identity, 16px
textarea/input text, wrapping order cards, and auth/card padding of 1rem before
the small breakpoint.

- [ ] **Step 2: Run the affected route/component tests and confirm failure**

Run: `cd client && npm test -- src/components/ProductFilters.test.tsx src/components/CartItemRow.test.tsx src/components/CheckoutForm.test.tsx 'src/app/(shop)'`

Expected: one or more new responsive contract assertions FAIL.

- [ ] **Step 3: Migrate routes to shared containers and task-order stacking**

Replace repeated `px-6 py-16 sm:py-20` patterns with mobile-safe container and
section utilities. Use single-column defaults, add `min-w-0` and `break-words` to
long content, and keep summary/action sections after the editable content on
mobile. Do not change action bindings or fetch order.

Use this route-shell pattern:

```tsx
<section className="relative">
  <div className="page-container page-section">
    <PageHeader title="Checkout" description="Confirm your details and place the order." />
    <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
      <div className="surface-pad min-w-0 flex-1 rounded-[1.5rem] border border-border-warm bg-cream-alt">
        <CheckoutForm />
      </div>
      <aside className="surface-pad w-full min-w-0 rounded-[1.5rem] border border-border-warm bg-cream-alt lg:w-96 lg:shrink-0">
        <h2 className="font-display text-xl text-cocoa">Order summary</h2>
      </aside>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Fix form and filter ergonomics**

Give text-entry inputs `text-base sm:text-sm`, make mobile controls full width,
keep labels persistent, stack button groups at 320px, and preserve inline error
associations. Quantity inputs retain numeric constraints and visible Update and
Remove actions.

For cart rows, use a narrow-first layout with named content regions:

```tsx
<div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto]">
  <div className="relative size-20 overflow-hidden bg-honey-light" aria-hidden={!item.imageUrl} />
  <div className="min-w-0 break-words">
    <p className="font-display text-lg text-cocoa">{item.name}</p>
    <p className="text-sm text-text-muted">{formatPrice(item.price)} each</p>
  </div>
  <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
    <form action={updateCartItemQuantity} className="flex items-center gap-2" />
    <p className="font-medium text-cocoa">{formatPrice(item.subtotal)}</p>
    <form action={removeCartItem} />
  </div>
</div>
```

- [ ] **Step 5: Run shop/auth tests and commit**

Run: `cd client && npm test -- src/components/ProductFilters.test.tsx src/components/CartItemRow.test.tsx src/components/CheckoutForm.test.tsx 'src/app/(shop)' 'src/app/(auth)'`

Expected: PASS.

```bash
git add 'client/src/app/(shop)' 'client/src/app/(auth)' client/src/components/ProductFilters.tsx client/src/components/CartItemRow.tsx client/src/components/CartItemRow.test.tsx client/src/components/CheckoutForm.tsx client/src/components/AccountForm.tsx
git commit -m "style(shop): complete narrow-screen commerce flows"
```

### Task 5: Build the responsive admin shell and route system

**Files:**
- Modify: `client/src/app/(admin)/layout.tsx`
- Modify: `client/src/components/admin/AdminNav.tsx`
- Create: `client/src/components/admin/AdminNav.test.tsx`
- Modify: `client/src/app/(admin)/admin/page.tsx`
- Modify: all routes under `client/src/app/(admin)/admin/{products,categories,orders,customers,reports}`
- Modify: all components under `client/src/components/admin`
- Modify: existing admin page and detail-panel tests

**Interfaces:**
- Replaces `AdminNav()` with `AdminNav({ mode, email })` while preserving active-route semantics.
- Produces mobile menu trigger with `aria-controls="admin-mobile-navigation"`.
- Preserves list/detail query parameters and all admin server actions.

- [ ] **Step 1: Write failing admin navigation and route-contract tests**

Test mobile menu expansion, active-link state, equivalent route availability, and
Escape/route close. Extend product, order, and customer page tests to require
stacked mobile filters/rows and `min-w-0` or wrapping on record content.

- [ ] **Step 2: Run admin tests and confirm failure**

Run: `cd client && npm test -- src/components/admin/AdminNav.test.tsx 'src/app/(admin)/admin' src/components/admin`

Expected: FAIL because the current admin navigation is always a vertical list and
some narrow-layout contracts are absent.

- [ ] **Step 3: Implement the mobile admin shell**

Keep the sticky sidebar at `lg` and above. Below `lg`, render a compact header
with brand, current section, and 44-pixel menu trigger. The disclosed navigation
contains all six admin destinations plus storefront and sign-out access, manages
expanded state accurately, and does not force full sidebar height above content.

The layout boundary must remain server-rendered and compose the client nav:

```tsx
<div className="min-h-screen bg-cream lg:flex">
  <aside className="hidden w-56 shrink-0 border-r border-border-warm bg-cream-alt lg:block">
    <div className="sticky top-0 flex min-h-screen flex-col p-4">
      <AdminNav mode="desktop" email={session.email} />
    </div>
  </aside>
  <div className="min-w-0 flex-1">
    <div className="sticky top-0 z-30 border-b border-border-warm bg-cream-alt lg:hidden">
      <AdminNav mode="mobile" email={session.email} />
    </div>
    {children}
  </div>
</div>
```

Update the component interface to:

```ts
export function AdminNav({ mode, email }: { mode: "mobile" | "desktop"; email: string })
```

- [ ] **Step 4: Adapt dashboard, lists, detail panels, forms, and reports**

Use one-column metric stacks at 320px when labels or currency values would
collide; stack filters and date controls full width; let badges wrap; preserve the
existing one-view-at-a-time mobile list/detail behavior; make form controls 16px
on mobile; and break long emails, names, amounts, and identifiers safely.

The shared filter form shape is:

```tsx
<form className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
  <input className="w-full min-w-0 text-base sm:w-auto sm:flex-1 sm:text-sm" />
  <select className="w-full text-base sm:w-auto sm:text-sm" />
  <button className="min-h-11 w-full sm:w-auto" type="submit">Filter</button>
</form>
```

- [ ] **Step 5: Run admin tests and commit**

Run: `cd client && npm test -- 'src/app/(admin)' src/components/admin src/components/ui/DetailPanel.test.tsx`

Expected: PASS.

```bash
git add 'client/src/app/(admin)' client/src/components/admin client/src/components/ui/DetailPanel.tsx client/src/components/ui/DetailPanel.test.tsx
git commit -m "style(admin): add complete mobile workflows"
```

### Task 6: Verify Next.js image policy and complete automated checks

**Files:**
- Modify only if verified safe: `client/next.config.ts`
- Modify: image-related tests identified by `rg -l "priority|sizes=|next/image" client/src -g '*.test.tsx'`
- Modify: `README.md` with the chosen Supabase image policy

**Interfaces:**
- Consumes imported WebP public URLs from the image-import plan.
- Produces one documented image strategy: Next optimization enabled, or optimized-source fallback retained.

- [ ] **Step 1: Read the installed Next.js 16 image guide**

Run: `Get-Content -Raw client/node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`

If that exact path differs, locate it with:

Run: `rg --files client/node_modules/next/dist/docs | rg 'image.*\.md$'`

Record the current `preload`, `priority`, `sizes`, remote pattern, and
`unoptimized` guidance before editing configuration.

- [ ] **Step 2: Test Supabase optimization in the production runtime**

Run: `cd client && npm run build`

Run: `cd client && npm run start`

Read one imported `image_url` from the catalog response, URL-encode it, and request
`/_next/image?url={encodedImageUrl}&w=640&q=75` from the running production client.
Expected safe result: HTTP 200 with an image content type. If the runtime returns
the known private/NAT64-address rejection, retain `images.unoptimized: true`.

- [ ] **Step 3: Encode the verified policy**

If optimization succeeds, remove only the global `unoptimized` flag and retain
the narrow Supabase `remotePatterns` entry. If it fails, keep the flag and update
the existing comment plus README to state that 1000px quality-82 WebP source
assets, accurate `sizes`, and lazy loading are the active fallback.

- [ ] **Step 4: Run the full automated suite**

Run: `cd client && npm test`

Run: `cd client && npm run lint`

Run: `cd client && npm run build`

Run: `cd server && npm test`

Run: `cd server && npm run build`

Expected: every command exits 0.

- [ ] **Step 5: Commit the verified image policy**

```bash
git add client/next.config.ts client/src README.md
git commit -m "perf(images): finalize responsive delivery policy"
```

### Task 7: Browser verification across every route family

**Files:**
- Modify only files implicated by observed defects
- Create: `docs/RESPONSIVE_VERIFICATION.md`

**Interfaces:**
- Produces a route/viewport verification matrix with observed result and fixes.

- [ ] **Step 1: Start API and production client with testable data**

Run the server and built client in separate hidden/background processes using the
project's configured environment. Confirm `/api/health` and `/` return HTTP 200.

- [ ] **Step 2: Verify public and auth routes at six widths**

At 320, 375, 430, 768, 1024, and 1440 widths, inspect `/`, `/products`, one
`/products/<id>`, `/about`, `/login`, and `/signup`. Check document scroll width,
navigation/menu operation, text wrapping, image crop/loading, focus order, touch
targets, and reduced-motion behavior.

- [ ] **Step 3: Verify authenticated customer routes**

Inspect `/cart`, `/checkout`, `/account`, `/orders`, and one `/orders/<id>` using
empty/populated data as applicable. Verify long product names, quantities,
addresses, totals, validation errors, list/detail transitions, and keyboard flow.

- [ ] **Step 4: Verify every admin route family**

Inspect `/admin`, products list/new/detail, categories list/new/detail, orders
list/detail, customers list/detail, and reports. Verify mobile navigation,
filters, date fields, badges, long values, list/detail behavior, form actions, and
desktop sticky/sidebar behavior.

- [ ] **Step 5: Record and fix defects with focused regression checks**

For each defect, add the smallest relevant automated assertion before the fix,
run that test red, implement the fix, run it green, and record the route and widths
in `docs/RESPONSIVE_VERIFICATION.md`. The final matrix must explicitly state no
unintended horizontal overflow at each required width.

- [ ] **Step 6: Run final verification and commit evidence**

Run: `cd client && npm test && npm run lint && npm run build`

Run: `cd server && npm test && npm run build`

Expected: all commands exit 0.

```bash
git add client server docs/RESPONSIVE_VERIFICATION.md
git commit -m "test(ui): verify responsive experience end to end"
```
