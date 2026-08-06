# Public Storefront Premium UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, responsive Royal Bakery public storefront across the shared shell, home, catalog, product detail, cart, checkout, and about pages without changing the existing color system or commerce contracts.

**Architecture:** Keep data fetching, authentication, and server actions in the existing Next.js App Router server components. Add focused client components only for Framer Motion, responsive navigation, filters, and interaction feedback; reusable visual patterns live under `src/components/storefront` and shared motion behavior under `src/components/motion`.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind CSS 4, Framer Motion 12.42.2, Lucide React, Vitest, Testing Library, and jsdom.

## Global Constraints

- Preserve the existing cocoa, caramel, honey, cream, warm-border, and muted-text color tokens; do not introduce a replacement palette.
- Keep existing catalog, authentication, cart, order, and payment API contracts unchanged.
- Do not fabricate ratings, testimonials, business statistics, shipping guarantees, ingredient claims, or delivery promises.
- Keep data-fetching pages as server components and pass only serializable props into client components.
- Use transform and opacity based motion, keep entrances approximately 200-500 ms, and honor `prefers-reduced-motion`.
- Use stable image aspect ratios and responsive constraints so dynamic content does not shift or overlap the layout.
- Keep interactive targets at least 44 by 44 CSS pixels where practical and preserve visible keyboard focus.
- Limit this milestone to the shared storefront shell, home, products, product detail, cart, checkout, and about pages.

---

## File Structure

### New files

- `client/vitest.config.ts`: jsdom test configuration and path aliases.
- `client/src/test/setup.ts`: DOM matcher and Next.js component mocks.
- `client/src/components/motion/MotionProvider.tsx`: global reduced-motion policy.
- `client/src/components/motion/Reveal.tsx`: reusable viewport reveal wrapper.
- `client/src/components/motion/StaggerGrid.tsx`: coordinated grid entrance wrapper and item.
- `client/src/components/storefront/SectionHeading.tsx`: consistent page-band headings and optional action.
- `client/src/components/storefront/EmptyState.tsx`: reusable recovery state.
- `client/src/components/storefront/StorefrontHeader.tsx`: responsive interactive header UI.
- `client/src/components/storefront/OrderSummary.tsx`: shared cart/checkout totals presentation.
- `client/src/components/storefront/SubmitButton.tsx`: server-form pending button using `useFormStatus`.
- `client/src/app/(shop)/loading.tsx`: storefront skeleton.
- `client/src/app/(shop)/error.tsx`: storefront API/runtime recovery boundary.
- `client/src/app/(shop)/products/[id]/not-found.tsx`: product-specific recovery state.
- Focused `*.test.tsx` files next to the components they exercise.

### Existing files to modify

- `client/package.json`: test script and UI/test dependencies.
- `client/src/app/globals.css`: base focus, selection, and motion-safe styles using existing tokens.
- `client/src/components/ui/Button.tsx`: premium button geometry, focus, and busy-state-safe dimensions.
- `client/src/components/ui/Card.tsx`: reduce card radius and normalize border/shadow behavior.
- `client/src/components/ui/Input.tsx`: accessible error linkage and stable control height.
- `client/src/app/(shop)/layout.tsx`: motion provider and refined shell structure.
- `client/src/components/Header.tsx`: retain server-side auth/cart lookup and delegate rendering.
- `client/src/components/Footer.tsx`: comprehensive storefront footer.
- `client/src/components/ProductCard.tsx`: visual hierarchy and interaction motion.
- `client/src/components/ProductFilters.tsx`: accessible search/category controls and reset behavior.
- `client/src/components/CartItemRow.tsx`: responsive line-item layout.
- `client/src/app/actions/cart.ts`: identify the cart row associated with a mutation failure.
- `client/src/components/CheckoutForm.tsx`: clearer form grouping and pending/error feedback.
- Public route files under `client/src/app/(shop)` for page composition and states.

---

### Task 1: Establish Test Harness, UI Foundation, And Motion Primitives

**Files:**

- Modify: `client/package.json`
- Modify: `client/src/app/globals.css`
- Modify: `client/src/components/ui/Button.tsx`
- Modify: `client/src/components/ui/Card.tsx`
- Modify: `client/src/components/ui/Input.tsx`
- Create: `client/vitest.config.ts`
- Create: `client/src/test/setup.ts`
- Create: `client/src/components/motion/MotionProvider.tsx`
- Create: `client/src/components/motion/Reveal.tsx`
- Create: `client/src/components/motion/StaggerGrid.tsx`
- Test: `client/src/components/motion/MotionPrimitives.test.tsx`

**Interfaces:**

- Produces: `MotionProvider({ children }: { children: ReactNode })`.
- Produces: `Reveal({ children, className?, delay?, once? }: RevealProps)` where `RevealProps` is `{ children: ReactNode; className?: string; delay?: number; once?: boolean }`.
- Produces: `StaggerGrid({ children, className? }: MotionContainerProps)` and `StaggerItem({ children, className? }: MotionContainerProps)` where `MotionContainerProps` is `{ children: ReactNode; className?: string }`.
- Produces: existing `Button`, `Card`, and `Input` APIs with no breaking prop changes.

- [ ] **Step 1: Add the component test toolchain**

Run:

```powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
npm install lucide-react
```

Add this script to `client/package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Configure Vitest and DOM setup**

Create `client/vitest.config.ts` with jsdom, `@/` aliasing to `client/src`, and setup file `src/test/setup.ts`.

```ts
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
});
```

Use this setup behavior so tests inspect semantic DOM without invoking Next.js rendering internals:

```tsx
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
```

- [ ] **Step 3: Write failing motion primitive tests**

Assert that children render through all wrappers, custom class names are preserved, and the provider exposes a reduced-motion-aware Motion configuration.

```tsx
it("renders reveal content without hiding semantic children", () => {
  render(<Reveal><h2>Featured products</h2></Reveal>);
  expect(screen.getByRole("heading", { name: "Featured products" })).toBeVisible();
});
```

- [ ] **Step 4: Run the focused test and confirm failure**

Run: `npm test -- src/components/motion/MotionPrimitives.test.tsx`

Expected: FAIL because the motion component modules do not exist.

- [ ] **Step 5: Implement motion primitives**

Use `MotionConfig reducedMotion="user"`, `useReducedMotion()`, `whileInView`, and variants. Reduced-motion mode must remove translation and stagger delay. Default reveal behavior is once-only with `{ amount: 0.2, once: true }`.

```tsx
const visible = { opacity: 1, y: 0 };
const hidden = { opacity: 0, y: reducedMotion ? 0 : 18 };
```

- [ ] **Step 6: Refine shared controls and global interaction styles**

Keep current component props, use `rounded-lg` for cards and controls, add `focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2`, ensure buttons have a stable minimum height, and connect input errors with `aria-invalid` and `aria-describedby`.

Add only existing-token base styles:

```css
::selection { background: var(--honey); color: var(--cocoa-dark); }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

- [ ] **Step 7: Run foundation checks**

Run: `npm test -- src/components/motion/MotionPrimitives.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS with no new warnings.

- [ ] **Step 8: Commit the foundation**

```powershell
git add client/package.json client/package-lock.json client/vitest.config.ts client/src/test client/src/app/globals.css client/src/components/ui client/src/components/motion
git commit -m "feat(storefront): add UI and motion foundation"
```

---

### Task 2: Build The Responsive Storefront Shell

**Files:**

- Modify: `client/src/app/(shop)/layout.tsx`
- Modify: `client/src/components/Header.tsx`
- Modify: `client/src/components/Footer.tsx`
- Create: `client/src/components/storefront/StorefrontHeader.tsx`
- Create: `client/src/app/(shop)/loading.tsx`
- Create: `client/src/app/(shop)/error.tsx`
- Test: `client/src/components/storefront/StorefrontHeader.test.tsx`

**Interfaces:**

- Consumes: `MotionProvider` from Task 1 and existing `signOut` server action.
- Produces: `StorefrontHeader({ signedIn, isAdmin, cartItemCount }: StorefrontHeaderProps)` where all props are serializable booleans/numbers.
- Keeps: `Header()` as the async server boundary responsible for Supabase user/session/cart lookup.

- [ ] **Step 1: Write failing responsive header tests**

Cover signed-out navigation, signed-in account/order/cart navigation, admin link visibility, cart quantity label, mobile menu disclosure semantics, and closing the menu after a navigation click.

```tsx
it("shows the cart quantity in an accessible label", () => {
  render(<StorefrontHeader signedIn isAdmin={false} cartItemCount={3} />);
  expect(screen.getByRole("link", { name: /cart, 3 items/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the header test and confirm failure**

Run: `npm test -- src/components/storefront/StorefrontHeader.test.tsx`

Expected: FAIL because `StorefrontHeader` does not exist.

- [ ] **Step 3: Implement the server/client header split**

Keep all existing Supabase calls and non-fatal cart-count handling in `Header.tsx`. Pass only `signedIn`, `isAdmin`, and `cartItemCount` to `StorefrontHeader`. Build desktop and mobile navigation with Lucide `Menu`, `X`, `ShoppingBag`, and `UserRound` icons, accessible labels, and `AnimatePresence` for the mobile panel.

The visible structure is a warm service strip, primary nav row, and mobile disclosure panel. Do not add claims beyond the existing Colombo location and online ordering capability.

- [ ] **Step 4: Expand the footer**

Add distinct Shop, Account, and About/navigation groups, retain the existing Colombo statement and dynamic copyright year, and keep the footer as a full-width band rather than a card.

- [ ] **Step 5: Add shell loading and error states**

`loading.tsx` renders stable cream/honey skeleton bands with `aria-label="Loading storefront"`. `error.tsx` is a client boundary that shows a concise failure message and a `Try again` button wired to `reset()`; it must not label API failures as an empty catalog.

- [ ] **Step 6: Wire the motion provider into the shop layout**

Wrap the existing shell with `MotionProvider`, retain the flex column page structure, and keep `main` as the semantic content landmark.

- [ ] **Step 7: Run shell checks**

Run: `npm test -- src/components/storefront/StorefrontHeader.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 8: Commit the shell**

```powershell
git add client/src/app/\(shop\)/layout.tsx client/src/app/\(shop\)/loading.tsx client/src/app/\(shop\)/error.tsx client/src/components/Header.tsx client/src/components/Footer.tsx client/src/components/storefront/StorefrontHeader.tsx client/src/components/storefront/StorefrontHeader.test.tsx
git commit -m "feat(storefront): redesign responsive shop shell"
```

---

### Task 3: Build Reusable Merchandising Components

**Files:**

- Modify: `client/src/components/ProductCard.tsx`
- Modify: `client/src/components/ProductFilters.tsx`
- Create: `client/src/components/storefront/SectionHeading.tsx`
- Create: `client/src/components/storefront/EmptyState.tsx`
- Test: `client/src/components/ProductCard.test.tsx`
- Test: `client/src/components/ProductFilters.test.tsx`
- Test: `client/src/components/storefront/EmptyState.test.tsx`

**Interfaces:**

- Consumes: existing `Product` and `Category` types, `formatPrice`, `StaggerItem`, and shared UI controls.
- Produces: `ProductCard({ product, priority? }: { product: Product; priority?: boolean })`.
- Produces: `ProductFilters` with existing props plus `resultCount: number`.
- Produces: `EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps)`.
- Produces: `SectionHeading({ eyebrow?, title, description?, action? }: SectionHeadingProps)` where `action` is a `ReactNode`.

- [ ] **Step 1: Write failing merchandising tests**

Product card tests cover image/no-image, formatted price, out-of-stock badge, full-card product link, and priority forwarding. Filter tests cover selected category state through `aria-pressed`, search labeling, query updates, and a reset control when filters are active. Empty-state tests cover heading, description, and recovery link.

```tsx
expect(screen.getByRole("button", { name: "Cakes" })).toHaveAttribute("aria-pressed", "true");
expect(screen.getByRole("link", { name: /browse all products/i })).toHaveAttribute("href", "/products");
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- src/components/ProductCard.test.tsx src/components/ProductFilters.test.tsx src/components/storefront/EmptyState.test.tsx`

Expected: FAIL on the new interfaces and missing storefront components.

- [ ] **Step 3: Redesign the product card**

Use a stable `aspect-[4/5]` media area, reserved metadata height, `rounded-lg`, subtle warm border, category-independent product name and price hierarchy, and explicit inventory state. Apply restrained Framer Motion hover/tap feedback to the image and card surface, disabled spatial motion for reduced-motion users, and a meaningful fallback containing the Royal Bakery name rather than a blank block.

- [ ] **Step 4: Redesign filters and empty state**

Give search a visible label, Lucide `Search` icon, and clear button. Preserve the existing 350 ms URL update behavior. Category controls remain buttons with `aria-pressed`; active filters expose a single reset route to `/products`. Display `resultCount` in a polite results summary.

- [ ] **Step 5: Implement section heading**

Use semantic content supplied by each page, display type only for the title, optional eyebrow and description, and a responsive action slot that wraps safely on narrow screens.

- [ ] **Step 6: Run merchandising checks**

Run: `npm test -- src/components/ProductCard.test.tsx src/components/ProductFilters.test.tsx src/components/storefront/EmptyState.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit merchandising components**

```powershell
git add client/src/components/ProductCard.tsx client/src/components/ProductCard.test.tsx client/src/components/ProductFilters.tsx client/src/components/ProductFilters.test.tsx client/src/components/storefront
git commit -m "feat(storefront): add premium merchandising components"
```

---

### Task 4: Compose The Premium Home Page

**Files:**

- Modify: `client/src/app/(shop)/page.tsx`

**Interfaces:**

- Consumes: existing `listCategories()` and `listProducts()` calls, `ProductCard`, `SectionHeading`, `EmptyState`, `Reveal`, `StaggerGrid`, and `StaggerItem`.
- Produces: unchanged `HomePage()` route contract.

- [ ] **Step 1: Capture the current home-page baseline**

Run the development server and inspect `/` at 1440x900 and 390x844. Record screenshots before editing so spacing, hierarchy, and overflow improvements can be compared after the task.

Expected: existing simple hero, category pills, and featured grid are visible when the API is configured.

- [ ] **Step 2: Implement the product-led hero**

Use the first available featured product image as visual media when present. The text column keeps `Royal Bakery` as the H1, moves the descriptive offer into supporting copy, and provides `Shop the menu` plus `Our story` actions. Keep hero height responsive and leave the category band visible at the bottom of common viewports.

Use only existing facts in copy:

```text
Royal Bakery
Cakes, pastries, and bread made for everyday cravings and meaningful celebrations in Colombo.
```

- [ ] **Step 3: Compose category and featured product bands**

Render categories as compact discovery links and featured products in a stable two/three/four-column grid. Mark only the first visible product images as `priority`. Use reveal and stagger wrappers without delaying link usability.

- [ ] **Step 4: Add value and story bands**

Create an unframed three-item value band limited to existing capabilities: browse the menu online, see current availability, and order ahead. Add an editorial story band that links to `/about`; do not repeat the full About-page text.

- [ ] **Step 5: Handle empty catalog data intentionally**

If categories are empty, omit only the category links while retaining the section rhythm. If products are empty, render `EmptyState` with a concise unavailable message and no false inventory claim.

- [ ] **Step 6: Verify the home page**

Run: `npm run lint`

Expected: PASS.

Browser checks at 1440x900, 768x1024, and 390x844:

- H1 is Royal Bakery and appears in the first viewport.
- A hint of the next band is visible.
- No text, image, or action overlap exists.
- Keyboard focus follows hero actions, categories, product links, and final CTA in visual order.
- Reduced-motion emulation removes translating entrances.

- [ ] **Step 7: Commit the home page**

```powershell
git add client/src/app/\(shop\)/page.tsx
git commit -m "feat(storefront): build premium bakery home page"
```

---

### Task 5: Redesign Catalog And Product Detail Pages

**Files:**

- Modify: `client/src/app/(shop)/products/page.tsx`
- Modify: `client/src/app/(shop)/products/[id]/page.tsx`
- Create: `client/src/app/(shop)/products/[id]/not-found.tsx`

**Interfaces:**

- Consumes: Task 3 `ProductFilters` with `resultCount`, `ProductCard`, `EmptyState`, motion wrappers, existing `getProduct`, `addToCart`, and Supabase auth lookup.
- Produces: unchanged `/products` search parameters `categoryId` and `search`.
- Produces: unchanged product purchase form fields `productId` and `quantity`.

- [ ] **Step 1: Add the catalog page hierarchy**

Create a compact page-introduction band, place filters in a sticky desktop region with an opaque cream background, and pass `products.length` as `resultCount`. Render a stable responsive grid and preserve URL-driven filtering.

- [ ] **Step 2: Add the filtered-empty recovery path**

When no products match, render `EmptyState` with title `No products found`, a specific description based on whether search/category filters are active, and a `Clear filters` link to `/products`.

- [ ] **Step 3: Redesign product detail media and purchase panel**

Use a two-column desktop layout, `aspect-[4/5]` media, visible stock status, product description, quantity label, and a full-width primary purchase action on narrow screens. Signed-out shoppers receive a clear `Sign in to add to cart` action with a secondary route back to the catalog. Preserve existing query-string error rendering near the form.

- [ ] **Step 4: Add truthful supporting reassurance**

Use an unframed divider list for `Current availability shown online`, `Order ahead through your account`, and `Pickup or delivery selection at checkout`. Do not add timing, returns, allergen, or freshness guarantees.

- [ ] **Step 5: Add product not-found recovery**

Render a clear missing-product heading, concise explanation, and `Back to all products` action in `not-found.tsx`.

- [ ] **Step 6: Verify catalog and detail pages**

Run: `npm test -- src/components/ProductCard.test.tsx src/components/ProductFilters.test.tsx src/components/storefront/EmptyState.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

Browser checks at 1440x900 and 390x844:

- Search/category URL updates still fetch the intended products.
- Zero results show a working reset path.
- Product images, long names, prices, quantity controls, errors, and stock badges do not overlap.
- Signed-in, signed-out, in-stock, out-of-stock, and missing-product states are actionable.

- [ ] **Step 7: Commit catalog and detail pages**

```powershell
git add client/src/app/\(shop\)/products
git commit -m "feat(storefront): redesign catalog and product detail"
```

---

### Task 6: Redesign Cart And Shared Order Summary

**Files:**

- Modify: `client/src/app/(shop)/cart/page.tsx`
- Modify: `client/src/app/actions/cart.ts`
- Modify: `client/src/components/CartItemRow.tsx`
- Create: `client/src/components/storefront/OrderSummary.tsx`
- Create: `client/src/components/storefront/SubmitButton.tsx`
- Test: `client/src/components/storefront/OrderSummary.test.tsx`

**Interfaces:**

- Consumes: existing `Cart`, `CartItem`, `formatPrice`, `updateCartItemQuantity`, and `removeCartItem` contracts.
- Produces: `OrderSummary({ items, subtotal, action?, editHref? }: OrderSummaryProps)` where `items` is `CartItem[]`, `action` is optional `ReactNode`, and `editHref` is optional `string`.
- Produces: `SubmitButton({ idleLabel, pendingLabel, ...buttonProps }: SubmitButtonProps)` using `useFormStatus()` and the existing `Button` component.
- Extends: `/cart` query parameters with optional `errorProductId` so an update/remove failure can render beside the affected line item.

- [ ] **Step 1: Write failing order-summary tests**

Assert accessible summary heading, item quantity/name/subtotal rows, formatted subtotal, optional edit link, and optional checkout action rendering.

```tsx
expect(screen.getByRole("heading", { name: "Order summary" })).toBeVisible();
expect(screen.getByText("Chocolate Cake x 2")).toBeVisible();
expect(screen.getByText("LKR 5,000")).toBeVisible();
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- src/components/storefront/OrderSummary.test.tsx`

Expected: FAIL because `OrderSummary` does not exist.

- [ ] **Step 3: Implement the shared summary**

Build a semantic section with an item list, subtotal divider, optional edit link, and optional action slot. Use `rounded-lg`, one border, and no nested card surfaces.

- [ ] **Step 4: Redesign cart line items**

Use stable thumbnail dimensions, link the product name/image to `/products/{productId}`, label the quantity input, retain server-action forms, keep line total visible, and ensure Update/Remove controls wrap into a logical mobile order. Preserve `min=1` and `max=item.stockQuantity`. Use `SubmitButton` for update/remove pending feedback without changing button dimensions.

- [ ] **Step 5: Localize cart mutation errors**

When `updateCartItemQuantity` or `removeCartItem` catches an error, preserve the existing message and redirect with both values:

```ts
const query = new URLSearchParams({ error: message, errorProductId: productId });
redirect(`/cart?${query.toString()}`);
```

Read `errorProductId` in the cart page and pass `error` only to the matching `CartItemRow`. Render it with `role="alert"` below that row's controls. Keep a page-level alert only when an error has no matching product ID.

- [ ] **Step 6: Compose the cart page**

Use a two-column desktop layout with line items on the left and sticky `OrderSummary` on the right. Mobile stacks the summary after items. Preserve auth redirect and query error behavior. The empty state includes `Browse the menu` and a useful heading.

- [ ] **Step 7: Run cart checks**

Run: `npm test -- src/components/storefront/OrderSummary.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

Browser checks with empty and populated carts at 1440x900 and 390x844:

- Quantity updates and removal still invoke existing server actions.
- Long product names and maximum valid quantities do not overlap totals/actions.
- Error messages appear above the affected cart region and remain readable.

- [ ] **Step 8: Commit the cart**

```powershell
git add client/src/app/\(shop\)/cart/page.tsx client/src/app/actions/cart.ts client/src/components/CartItemRow.tsx client/src/components/storefront/OrderSummary.tsx client/src/components/storefront/OrderSummary.test.tsx client/src/components/storefront/SubmitButton.tsx
git commit -m "feat(storefront): redesign cart and order summary"
```

---

### Task 7: Redesign Checkout Form And Page

**Files:**

- Modify: `client/src/app/(shop)/checkout/page.tsx`
- Modify: `client/src/components/CheckoutForm.tsx`
- Test: `client/src/components/CheckoutForm.test.tsx`

**Interfaces:**

- Consumes: `OrderSummary` from Task 6 and existing `placeOrder` server action contract.
- Keeps: form field `deliveryAddress` and `{ error: string | null }` action state shape.

- [ ] **Step 1: Write failing checkout form tests**

Mock `placeOrder` and assert persistent delivery-address labeling, pickup guidance, submit intent, pending label, disabled pending button, and server-error alert semantics.

```tsx
expect(screen.getByRole("textbox", { name: /delivery address/i })).toBeVisible();
expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
```

- [ ] **Step 2: Run the checkout test and confirm failure**

Run: `npm test -- src/components/CheckoutForm.test.tsx`

Expected: FAIL on the new accessible alert/pending behavior.

- [ ] **Step 3: Redesign the checkout form**

Add a clear `Fulfilment details` heading, retain optional textarea behavior, keep pickup guidance visible, render `state.error` with `role="alert"`, and apply `aria-busy={pending}` to the form. Preserve exact form field names and action wiring.

- [ ] **Step 4: Compose the checkout page**

Use a two-column desktop layout with the form first in DOM order and a sticky order summary second. On mobile, keep the form first and summary below it. Preserve signed-out and empty-cart redirects. Include a clear return-to-cart link without changing order placement.

- [ ] **Step 5: Run checkout checks**

Run: `npm test -- src/components/CheckoutForm.test.tsx src/components/storefront/OrderSummary.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

Browser checks at 1440x900 and 390x844:

- Keyboard order reaches the form before the summary edit link.
- Pending state prevents duplicate submission and does not resize the primary button.
- Server errors remain adjacent to the form and are announced.
- The existing order placement and payment continuation behavior is unchanged.

- [ ] **Step 6: Commit checkout**

```powershell
git add client/src/app/\(shop\)/checkout/page.tsx client/src/components/CheckoutForm.tsx client/src/components/CheckoutForm.test.tsx
git commit -m "feat(storefront): refine checkout experience"
```

---

### Task 8: Complete About Page And End-To-End Storefront Verification

**Files:**

- Modify: `client/src/app/(shop)/about/page.tsx`
- Modify as required by verified defects: files changed in Tasks 1-7 only

**Interfaces:**

- Consumes: shared section, reveal, and storefront shell components.
- Produces: unchanged static `/about` route.

- [ ] **Step 1: Recompose the About page**

Create an editorial opening with `About Royal Bakery` as H1, split the existing story into readable sections, add a values band using only existing project copy, and end with a `Browse the menu` action. Remove or soften unsupported absolutes such as universal freshness or ingredient guarantees unless verified business content exists in the repository.

- [ ] **Step 2: Run the complete automated suite**

Run:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all component tests, lint, and TypeScript checks pass. The build passes when the API/Supabase environment is available; if external configuration blocks route data fetching, record the exact route and error separately rather than treating it as a visual failure.

- [ ] **Step 3: Verify all public routes in a configured browser session**

Check `/`, `/products`, one valid `/products/{id}`, one missing product URL, `/about`, `/cart`, and `/checkout` at 1440x900, 768x1024, and 390x844. Exercise signed-out and signed-in paths where authentication is required.

For every page confirm:

- No horizontal overflow, clipping, overlap, or unexpected layout shift.
- Header/mobile menu/footer navigation works and has visible focus.
- Images load with correct aspect ratio or intentional fallback.
- Buttons, links, filters, forms, empty states, and error states remain actionable.
- Motion is restrained and reduced-motion emulation removes spatial effects.
- Browser console has no new hydration, accessibility, image-sizing, or runtime errors.

- [ ] **Step 4: Run canvas-free screenshot review**

Capture full-page desktop and mobile screenshots for all scoped routes. Compare typography hierarchy, spacing rhythm, card geometry, palette consistency, and first-viewport composition against the design spec. Fix only defects within the scoped storefront files, then repeat the relevant screenshot.

- [ ] **Step 5: Re-run final checks after visual fixes**

Run:

```powershell
npm test
npm run lint
npx tsc --noEmit
```

Expected: PASS with no regressions.

- [ ] **Step 6: Commit final polish**

```powershell
git add client/src/app/\(shop\) client/src/components client/src/app/globals.css
git commit -m "feat(storefront): complete premium public experience"
```

---

## Completion Evidence

Before declaring the milestone complete, retain these results in the handoff:

- `npm test` result and test count.
- `npm run lint` result.
- `npx tsc --noEmit` result.
- `npm run build` result or the exact external configuration error that prevented it.
- Routes and viewport sizes visually checked.
- Any remaining limitation caused by missing Supabase configuration or absent catalog images.
