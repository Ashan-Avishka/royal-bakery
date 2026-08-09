# List Detail Panel Design

## Goal

Add a click-to-preview right-side detail panel to four existing list pages — Admin Orders, Admin Products, Admin Customers, and the customer's own Orders — so clicking an item shows its full details next to the list instead of navigating away. The panel must visually match the existing warm cocoa/caramel/cream design system already used on these pages.

## Scope

### Included

- Right-side detail panel on: `/admin/orders`, `/admin/products`, `/admin/customers`, `/orders`
- Selection tracked via a `?selected=<id>` query param on the list page (composes with existing filters, survives refresh/back-forward, shareable)
- List row click targets updated to select via query param instead of full-page navigation
- Responsive behavior: side-by-side on desktop, one-pane-at-a-time on mobile
- "Not found" handling for a stale/invalid/not-owned `selected` id

### Excluded

- Changes to the existing standalone `/admin/orders/[id]`, `/orders/[id]`, `/admin/products/[id]` (edit) pages — they remain exactly as-is and keep serving direct links (e.g. the post-checkout redirect to `/orders/[id]?payment=success`)
- New backend endpoints or API contract changes
- Admin Customers' inline role-change control — stays on the list row, not moved into the panel
- Any redesign of existing colors, typography, or components beyond what's needed to build the panel

## Pattern

Each list page reads `selected` from its `searchParams` alongside its existing filters. When present, the page fetches (or looks up, if already in the fetched list) that one item and renders a two-column layout: the existing list on the left, a new `DetailPanel` on the right. Clicking a list row links to the same page with `selected` set (existing filters preserved); the panel's close (×) control links back to the same page with `selected` removed.

The existing full-page `[id]` routes for orders and the product edit page are untouched. This keeps the change additive and low-risk: nothing that currently links to those routes (including the post-checkout payment redirect) needs to change.

## Components

**`components/ui/DetailPanel.tsx`** (new, generic shell)
Sticky card matching existing `border-border-warm` / `bg-cream-alt` styling. Props: `title`, a close href, and children. Renders a placeholder ("Select an item to see details") when used with no selection.

**`components/admin/OrderDetailPanel.tsx`** (new)
Items list, total, fulfillment (delivery/pickup), order id, payment/order status badges, and the existing `UpdateOrderStatusForm`. Mirrors `admin/orders/[id]/page.tsx`'s content minus the "← All orders" back link.

**`components/admin/ProductDetailPanel.tsx`** (new)
Image, price, category, stock/availability badges, description, and an "Edit" button linking to the existing `/admin/products/[id]` edit page. Read-only — no form fields.

**`components/admin/CustomerDetailPanel.tsx`** (new)
Name, role badge, phone, address, joined date — the same fields already shown in the list row. No role-change control (stays on the row).

**`components/OrderDetailPanel.tsx`** (new, user-facing)
Items list, total, fulfillment, status badges, and `PayNowButton` when unpaid. Does not include the payment-confirmation banners or `PaymentStatusPoller` — those remain exclusive to the standalone `/orders/[id]?payment=...` page reached from checkout.

## Data Fetching

- **Orders** (admin and user): the list endpoints return summaries without line items, so selecting an order triggers one extra fetch via the existing `getAdminOrder` / `getOrder` functions.
- **Products**: `getAdminProduct` already works by fetching the full product list and finding the id — since the list page already has that same list loaded, the panel looks up the selected product directly from the already-fetched array. No extra request.
- **Customers**: `listAdminCustomers` returns full profile fields already. The panel looks up the selected customer directly from the already-fetched array. No extra request.

No new backend endpoints are needed.

## Layout & Responsive Behavior

```
<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
  <div class="min-w-0 flex-1">          <!-- list; hidden on mobile when something is selected -->
  <aside class="w-full lg:w-96 lg:sticky lg:top-24">  <!-- panel; hidden on mobile when nothing is selected -->
</div>
```

- **Desktop (`lg` and up)**: list and panel always show side by side. With nothing selected, the panel shows the placeholder state.
- **Mobile**: only one pane shows at a time. With nothing selected, only the list shows (no empty panel box). Once an item is selected, the list hides and the panel takes full width with a "← Back to list" link that clears `selected`.
- List rows change from linking to the old full-page routes to linking to `?...&selected=<id>` (existing filter params preserved). The selected row gets a visual highlight consistent with the existing hover treatment. Admin Customers rows aren't currently links — the name/info block becomes the click target, kept separate from the role-change control so selecting a customer doesn't interfere with changing their role.

## Error Handling

If `selected` refers to an id that doesn't exist, was deleted, or (for orders) isn't owned by the current user, the panel shows a small "Item not found" message in place of the detail content. The list itself renders normally and is unaffected — this must never throw or 404 the whole page.

## Testing

- Component/page tests (existing project convention: colocated `*.test.tsx` via the client's test setup) for each of the four pages: renders placeholder with no selection, renders panel content with a valid `selected`, renders "not found" state with an invalid `selected`, row links carry `selected` while preserving existing filter params.
- Manual browser verification (per this project's `run` workflow) at desktop and mobile widths for all four lists: select → panel appears; close/back → returns to list-only state; deep-linking directly to a URL with `?selected=` renders the panel pre-opened.

## Acceptance Criteria

- Clicking a row in any of the four lists shows that item's details in a right-side panel without a full page navigation.
- The panel's visual language (colors, borders, badges, spacing) is indistinguishable from the rest of each existing page.
- Existing standalone detail/edit pages and the post-checkout redirect flow are unaffected.
- Desktop shows list + panel side by side; mobile shows one pane at a time with a working back/close path.
- An invalid or stale `selected` id degrades gracefully to a "not found" message, never an error page.
- Client lint/type/build checks pass.

## Delivery Boundary

This covers the four listed pages only. Any further list pages (e.g. Admin Categories) that might benefit from the same pattern are explicitly out of scope and would be a separate follow-up.
