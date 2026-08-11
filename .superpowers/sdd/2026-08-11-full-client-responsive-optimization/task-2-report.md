# Task 2 report — accessible mobile storefront shell

## RED evidence

- Added `SiteNav.test.tsx` and ran `cd client && npm.cmd test -- src/components/SiteNav.test.tsx src/components/Footer.test.tsx`.
- The initial run failed as expected: SiteNav exposed no `Open navigation` trigger (four navigation failures); Footer also failed its existing mobile touch-target and `Our bakery` expectation.
- Added the pathname-close regression test, temporarily removed the route-close effect, and reran the same command. It failed with `aria-expanded="true"` after the pathname changed, proving the test detects the missing close behavior.

## GREEN evidence

- Restored the route-close effect and ran `cd client && npm.cmd test -- src/components/SiteNav.test.tsx src/components/Footer.test.tsx`.
- Result: 2 files passed, 6 tests passed.
- Confirmed `rg -n "StorefrontHeader" client/src -g '*.tsx'` produces no matches after removing the unused implementation and tests.

## Files

- Modified `client/src/components/SiteNav.tsx`
- Added `client/src/components/SiteNav.test.tsx`
- Modified `client/src/components/MainShell.tsx`
- Modified `client/src/components/Footer.tsx`
- Removed `client/src/components/storefront/StorefrontHeader.tsx`
- Removed `client/src/components/storefront/StorefrontHeader.test.tsx`
- Removed `client/src/components/storefront/StorefrontHeader.reduced-motion.test.tsx`

## Commit

- `HEAD` — `feat(storefront): add accessible mobile shell`

## Self-review

- Preserved `SiteNav({ isSignedIn, isAdmin, cartItemCount })` and the server `Header` boundary.
- Added a labelled disclosure trigger with accurate `aria-expanded`, `aria-controls`, Escape handling, route-change close behavior, and an inert/`aria-hidden` hidden menu wrapper.
- Applied reduced-motion offset/duration handling and retained one cart action in the compact header to avoid duplicate mobile controls.
- Reused `safe-x` and `touch-target`; `MainShell` shares the `SITE_HEADER_HEIGHT` token rather than a separate spacing value.
- Footer links now meet the touch-target and accessible hover-token contract.

## Concerns

- `npm.cmd run lint` still exits 1 for three unrelated baseline violations: `ProductCard.tsx`, `home/AutoCarousel.tsx`, and `storefront/SectionHeading.test.tsx`. SiteNav introduces no remaining lint error.
- `@testing-library/user-event` is not installed in the client workspace, so the new behavior tests use the existing `fireEvent` test utility.
