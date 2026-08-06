# Public Storefront Premium UI Design

## Goal

Transform Royal Bakery's public storefront into a balanced premium e-commerce experience while preserving the existing cocoa, caramel, honey, and cream color system. The redesign covers the shared storefront shell, home, product listing, product detail, cart, checkout, and about pages.

The result should feel refined and trustworthy without becoming sparse luxury editorial design or a dense utility storefront. Product discovery, ordering, and checkout remain the primary jobs of every page.

## Scope

### Included

- Responsive storefront header, mobile navigation, cart affordance, and footer
- Home page merchandising and brand storytelling
- Product listing with search, category filtering, result context, and empty states
- Product detail with clear purchase controls and supporting trust information
- Cart and checkout information hierarchy, summaries, and empty/error states
- About page with a richer brand narrative
- Reusable storefront UI and motion primitives
- Keyboard, focus, reduced-motion, and responsive behavior

### Excluded

- Admin pages and internal operations UI
- New backend endpoints, database schema changes, or payment behavior
- Changes to the existing color palette
- New catalog, review, promotion, wishlist, or recommendation data models
- Fabricated claims, ratings, delivery guarantees, or business statistics

## Experience Direction

The visual language is a balanced premium bakery storefront: warm, tactile, polished, and easy to shop. Existing `cream`, `cocoa`, `caramel`, `honey`, and warm-border tokens remain the only dominant palette. Contrast, whitespace, typography, borders, shadows, imagery, and restrained tonal surfaces create hierarchy instead of introducing a new color theme.

Fraunces remains the expressive display face for brand and major editorial headings. Geist remains the functional face for navigation, prices, forms, and supporting copy. Display type is reserved for page-level moments; compact commerce surfaces use smaller, tighter typography.

The layout uses full-width page bands and constrained inner containers. Product cards are individual repeated items with modest corner radii. Page sections do not become floating cards, and cards are not nested inside other cards.

## Information Architecture

### Shared Storefront Shell

The header has three layers when appropriate:

1. A slim service strip for concise store reassurance using only facts already represented in the product or project content.
2. A primary navigation row with a prominent Royal Bakery brand mark, desktop navigation, account access, and cart count.
3. A mobile menu that exposes the same destinations and account/cart actions without horizontal crowding.

The header remains sticky with a solid warm surface and subtle border so it stays readable over all content. The footer provides shop navigation, account links, contact/brand information already present in the project, and a concise brand closing statement.

### Home

The first viewport presents Royal Bakery as the primary signal, supported by product-led copy and clear actions to browse products and learn the story. The composition uses real catalog imagery when usable images are available. When no suitable image exists, the hero uses a deliberate typographic and product-preview composition in the existing palette rather than an unrelated stock image.

Below the hero:

- Category discovery with clear selected and hover states
- Featured product grid driven by existing catalog data
- A compact value proposition band based on verifiable qualities only
- An editorial brand-story band linking to About
- A final shopping call to action

The first viewport leaves a visible hint of the next section on common desktop and mobile sizes.

### Products

The catalog page opens with a compact page introduction, then a sticky or naturally persistent filter region depending on viewport size. Search and category controls clearly communicate active state. A result summary tells users what they are seeing without requiring backend changes.

Products use a responsive grid with stable image aspect ratios, visible names and prices, inventory state, and a clear path to details. Empty results provide a direct reset action. API failure remains an application error boundary concern and must not masquerade as a valid empty catalog.

### Product Detail

The detail page uses a two-column desktop composition and a single-column mobile flow. Product media is large enough to inspect and maintains a stable aspect ratio. The purchase panel includes category context when available, product name, price, stock status, description, quantity, and primary add-to-cart action.

Supporting reassurance is presented as an unframed list or band. It uses only established facts and avoids invented shipping, freshness, allergen, or returns promises. Out-of-stock and signed-out states remain explicit and actionable.

### Cart

The cart separates editable line items from an order summary. Desktop uses a product list with a sticky summary column; mobile stacks the summary after the line items. Product image, name, unit price, quantity, line total, update behavior, and removal behavior remain scannable.

The empty cart is a complete recovery state with a concise message and a prominent route back to products. Loading, mutation failure, and invalid quantity feedback stay close to the action that caused them.

### Checkout

Checkout emphasizes calm completion. Customer and delivery fields are grouped into clear sections, while the order summary remains visible on desktop and follows the form on mobile. Field labels stay persistent, validation appears next to its field, and the payment action communicates its intent clearly.

No payment flow or validation contract changes are introduced. The redesign only improves structure, feedback, focus order, and responsive presentation around the existing checkout behavior.

### About

The About page becomes a structured brand narrative rather than a single text block. It includes an opening story, bakery values expressed without unsupported claims, and a closing route back to shopping. The page uses editorial typography and image opportunities from existing project assets or catalog content while keeping the layout useful and restrained.

## Component Architecture

The redesign follows the existing Next.js App Router and server-component data flow. Data-fetching pages remain server components. Animation and interactive behavior are introduced through focused client components with serializable props.

Planned reusable units:

- Storefront container and section-heading patterns for consistent width and rhythm
- Responsive header navigation and mobile menu client component
- Motion provider that respects the user's reduced-motion preference
- Reveal, stagger, and interactive press/hover motion primitives
- Product card with stable image geometry and consistent catalog metadata
- Product grid and catalog empty state
- Filter controls with accessible active states and debounced search behavior
- Commerce summary patterns shared visually by cart and checkout
- Small trust/value item pattern for unframed supporting information

Existing server APIs, route contracts, authentication checks, and form actions remain authoritative. Client animation wrappers must not trigger duplicate fetching or move sensitive server logic into the browser.

## Motion System

Framer Motion is used for purposeful feedback and hierarchy:

- Hero copy and featured media enter with a short coordinated sequence
- Section content reveals once as it approaches the viewport
- Product grids use light stagger on initial appearance and filter changes
- Product cards use restrained image scale/elevation on hover and a small press response on tap
- Mobile navigation and conditional UI use enter/exit transitions
- Cart count and compatible layout changes use subtle layout animation

Motion should use opacity and transforms to avoid layout thrashing. Default entrances remain approximately 200-500 ms, while hover and press feedback stays faster. No perpetual decorative animation, aggressive parallax, or scroll hijacking is included.

Reduced-motion preferences disable spatial movement and staggering, leaving immediate state changes or minimal opacity transitions. Animations never delay access to controls or essential content.

## Responsive And Accessible Behavior

- Primary breakpoints follow the project's Tailwind conventions rather than introducing a second responsive system.
- Fixed-format elements use stable aspect ratios and min/max constraints to prevent layout shift.
- Navigation, filters, product controls, cart rows, and checkout fields remain usable at narrow mobile widths.
- Interactive targets are at least 44 by 44 CSS pixels where practical.
- Focus indicators are visible against cream and cocoa surfaces.
- All controls have accessible names; icon-only controls require text alternatives and tooltips where their meaning is not universal.
- Semantic heading order, landmarks, labels, link purpose, and keyboard navigation are preserved.
- Images retain useful alternative text and use intentional responsive sizing.

## Data, Loading, Empty, And Error States

Public pages continue to consume the existing catalog, auth, cart, and checkout interfaces. The design must render coherently for:

- Populated and empty category lists
- Populated, empty, and filtered-to-zero product lists
- Products with and without image URLs
- In-stock and out-of-stock products
- Signed-in and signed-out shoppers
- Empty and populated carts
- Form validation and server mutation failures

Missing Supabase server configuration is an environment error, not a UI empty state. It should continue to surface as an error until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in `server/.env`.

## Verification And Acceptance Criteria

The public storefront is complete when:

- All scoped pages share one coherent premium visual system using the existing palette.
- Desktop and mobile layouts have no overlapping, clipped, or horizontally overflowing text and controls.
- Product imagery has stable geometry and meaningful fallbacks.
- Search, filters, navigation, auth links, cart actions, and checkout behavior retain their existing functional contracts.
- Motion is present but restrained, transform/opacity based, and reduced-motion aware.
- Empty, unavailable, out-of-stock, signed-out, and validation states are intentional and actionable.
- The client passes its available lint and type/build checks, except for any documented external environment dependency.
- Browser verification covers the home, catalog, product detail, cart, checkout, and about pages at representative desktop and mobile viewports.

## Delivery Boundary

This milestone ends with a polished public storefront. Admin redesign, backend configuration, new commerce capabilities, and production content photography remain separate follow-up work.
