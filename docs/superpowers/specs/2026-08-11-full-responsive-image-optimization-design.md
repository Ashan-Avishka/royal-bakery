# Full Responsive and Image Optimization Design

## Goal

Optimize the complete Royal Bakery client for mobile usability, image delivery,
performance, accessibility, and visual consistency. The work covers the public
storefront, authentication, customer account and ordering routes, and every
admin route. It also imports the 31 real product photographs from
`System/assets/products` into both local and hosted Supabase environments.

The result must preserve the established cocoa, caramel, honey, cream, Fraunces,
and Geist identity while making every route reliable from a 320-pixel viewport
through large desktop screens.

## Scope

### Included

- A deterministic product-image conversion and import workflow
- Local and hosted Supabase Storage uploads and product-row updates
- Optimized WebP derivatives while retaining every source PNG unchanged
- Shared mobile-first layout, spacing, typography, control, and media rules
- Responsive storefront, authentication, account, order, and admin surfaces
- Image loading, client JavaScript, motion, and rendering optimization
- Accessibility and reduced-motion improvements
- Automated and browser-based verification

### Excluded

- Changes to product pricing, inventory, descriptions, or category structure
- Backend schema changes unrelated to image delivery
- Deleting source images or unrelated Supabase Storage objects
- Redesigning the established brand palette or replacing the real photographs
- New commerce, wishlist, promotion, review, or reporting capabilities

## Image and Data Pipeline

The repository contains 31 square 1254-by-1254 PNG photographs, one for every
catalog product. An explicit manifest will map each source filename to its
canonical product name. The manifest will account for known filename spelling
differences, including `chiken_*`, `robbon_cake.png`, and `kibula_bun.png`, rather
than renaming or guessing from the source files at runtime.

A dedicated idempotent import script will:

1. Validate that every manifest file exists and every catalog product has one
   mapping before any upload begins.
2. Produce a visually equivalent WebP derivative from each source PNG without
   modifying the original.
3. Resolve the matching product by canonical name and the project's established
   aliases.
4. Upload the derivative to the stable object path
   `<product-id>/catalog.webp` in the public `product-images` bucket, replacing
   only that intended object on reruns.
5. Update `products.image_url` only after the corresponding upload succeeds.
6. Print per-environment validation, upload, update, failure, and final totals.

The command interface will support `local`, `hosted`, and `all` targets. Each
target will use its own environment configuration. Credentials will never be
embedded in source files or output. The `all` command will run the same validated
manifest against both targets and report results independently so a hosted
failure cannot be mistaken for local success.

The importer will not delete older unrelated objects. Stable object paths and
upsert behavior prevent timestamped duplicates. A partial failure leaves
previously valid product URLs intact for products whose replacement upload did
not succeed.

## Responsive Interface System

The client will use a mobile-first system rather than route-specific emergency
overrides. Shared patterns will define:

- Edge-safe containers with compact mobile gutters and progressively larger
  tablet and desktop spacing
- Fluid display typography with bounded `clamp()` values and safe wrapping
- Consistent vertical page rhythm and surface padding
- Form controls with readable mobile font sizes and practical 44-by-44-pixel
  touch targets
- Stable media geometry and rules for long names, emails, prices, identifiers,
  and status labels
- A semantic z-index scale for sticky navigation, menus, panels, and feedback

The design must work at 320 pixels without page-level horizontal scrolling,
overlap, clipped copy, or inaccessible controls. Components may use intentional
horizontal scrolling only for clearly signaled carousels or data regions where
stacking would destroy meaning.

### Storefront and Customer Routes

- The storefront header will retain accessible navigation and cart access while
  using a compact mobile menu that fits narrow and safe-area-constrained screens.
- Home-page heroes, category showcases, promotional media, trust content, and
  product carousels will reduce height and decorative load on small screens while
  preserving hierarchy and the next-section cue.
- Catalog grids will adapt from one column at the narrowest widths to two or more
  columns only when product-card content remains comfortably usable.
- Product details will stack media, information, and purchase controls in task
  order. Primary actions will remain easy to reach and will not be compressed by
  quantity or status content.
- Cart, checkout, account, order list, and order detail layouts will stack their
  summaries and actions predictably. Long addresses and order metadata will wrap
  without breaking the viewport.
- Authentication surfaces will use edge-safe cards, support short viewports and
  mobile keyboards, and avoid inputs smaller than 16 pixels on mobile.

### Admin Routes

- The desktop sidebar will become a compact mobile administration header and
  navigation surface, without forcing the full vertical sidebar above every page.
- Dashboard metrics will reflow without squeezed labels or values.
- Search, category, stock, and status filters will stack or wrap with full-width
  controls at narrow widths.
- Product, order, category, and customer lists will use mobile-friendly record
  rows. List/detail routes will show one task-focused view at a time on mobile and
  retain the split view on sufficiently wide screens.
- Create and edit forms, detail panels, status controls, and report summaries will
  preserve logical reading order, visible actions, and long-content resilience.

## Image Delivery and Rendering

All product images will use meaningful alternative text and stable aspect ratios.
Responsive `sizes` values will reflect the actual grid or detail width rather
than over-fetching viewport-wide images. Below-the-fold images will remain lazy;
only a genuine initial LCP image may receive priority or preload treatment.

The implementation will first test whether the deployed Next.js runtime can
reliably optimize Supabase public images. If it can, the global `unoptimized`
escape hatch will be removed and the Supabase remote pattern retained. If the
runtime still rejects valid Supabase URLs because of its documented network
resolution constraint, the application will keep the escape hatch and rely on
the pre-compressed WebP source assets, explicit responsive sizing, and browser
lazy loading. This fallback must be documented and must not block the rest of
the optimization work.

Missing or failed images will render the existing designed fallback without
causing layout shift. Decorative imagery will not receive misleading alternative
text.

## Performance and Motion

- Restrict preloading to the primary above-the-fold image.
- Avoid client state for hover-only presentation where CSS can provide the same
  behavior, particularly in repeated product cards.
- Remove or simplify expensive blur, shadow, and layered effects on touch and
  constrained screens when they do not improve task comprehension.
- Keep purposeful animations on transforms and opacity, and ensure content is
  visible without animation execution.
- Disable spatial movement and nonessential looping effects for reduced-motion
  users.
- Reserve layout space for images, loading states, menus, and dynamic counts to
  reduce cumulative layout shift.
- Keep server components and existing data-fetching boundaries authoritative;
  responsive work must not shift unnecessary data or logic into the browser.

## Accessibility and Interaction

The optimized interface will preserve semantic landmarks and heading order,
persistent field labels, keyboard navigation, visible focus states, accessible
names for icon-only controls, and accurate menu expansion state. Body and form
text will meet WCAG AA contrast requirements. Status must not be communicated by
color alone.

Touch interactions will not depend on hover. Menus and panels will manage focus
and inert content correctly. Safe-area insets will protect edge-aligned controls
on supported mobile devices. Error, empty, unavailable, signed-out, and loading
states will remain explicit and actionable.

## Error Handling

The image importer will fail validation before uploading when the manifest,
source files, product records, bucket, or required environment configuration is
incomplete. Operational failures will identify the environment and product but
will not print secrets. Product rows will never be pointed at an object whose
upload failed.

Client API and environment failures will remain distinguishable from valid empty
catalogs or order lists. Responsive transformations must preserve all existing
validation and mutation feedback near the control that caused it.

## Testing and Verification

Automated checks will cover:

- Manifest completeness and exact filename-to-product mapping
- WebP conversion and stable storage paths
- Dry-run or mocked import behavior, upload failure handling, and row-update order
- Shared responsive component contracts and accessible navigation state
- Product image attributes, fallbacks, and priority behavior
- Existing storefront, auth, customer, and admin behavior

The implementation will run the available client and server test suites, lint,
type checks, and production builds. Browser verification will cover representative
routes at 320, 375, 430, 768, 1024, and desktop widths. It will exercise populated,
empty, missing-image, long-content, signed-out, customer, and admin states where
the available environment permits.

The database phase will verify that all 31 products in both local and hosted
Supabase have reachable public WebP URLs. Environment-specific limitations will
be reported explicitly rather than represented as completed checks.

## Acceptance Criteria

- All 31 source PNGs remain unchanged.
- All 31 catalog products have deterministic optimized WebP images in local and
  hosted Supabase Storage and matching `image_url` values.
- The importer is safe to rerun without producing timestamped duplicates.
- Every client route is usable from 320 pixels through large desktop screens,
  with no unintended page-level horizontal overflow, overlap, or clipped content.
- Navigation, forms, filters, lists, detail panels, cart, checkout, and admin
  workflows retain their current functional contracts.
- Images have stable geometry, accurate responsive sizing, meaningful fallbacks,
  and restrained priority loading.
- Motion is purposeful, rendering-conscious, touch-safe, and reduced-motion aware.
- Keyboard, focus, labeling, contrast, and error-state checks meet the defined
  accessibility requirements.
- Tests, lint, type/build checks, and route-level browser verification pass, or
  any external environment blocker is documented with the exact unverified scope.

## Delivery Boundary

This milestone ends with the complete image import workflow and a responsive,
optimized client across storefront, auth, customer, and admin surfaces. It does
not introduce new business capabilities or alter the catalog beyond assigning
the supplied photographs to their existing products.
