"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
];

export interface StorefrontHeaderProps {
  signedIn: boolean;
  isAdmin: boolean;
  cartItemCount: number;
}

const linkClassName =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-cocoa transition-colors hover:text-caramel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2";
const adminLinkClassName =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-caramel-hover transition-colors hover:text-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2";
const primaryLinkClassName =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-cocoa px-4 text-sm font-medium text-cream-alt transition-colors hover:bg-cocoa-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2";

export function StorefrontHeader({
  signedIn,
  isAdmin,
  cartItemCount,
}: StorefrontHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const mobileMenuOffset = reducedMotion ? 0 : -8;
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const cartLabel = `Cart, ${cartItemCount} ${cartItemCount === 1 ? "item" : "items"}`;

  const accountLinks = signedIn
    ? [
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
        { href: "/orders", label: "My Orders" },
        { href: "/account", label: "Account" },
      ]
    : [
        { href: "/login", label: "Sign In" },
        { href: "/signup", label: "Sign Up" },
      ];

  return (
    <header className="sticky top-0 z-20 border-b border-border-warm bg-cream-alt/95 backdrop-blur">
      <div className="border-b border-border-warm bg-honey-light/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs font-medium text-cocoa sm:px-6">
          <span>Colombo, Sri Lanka</span>
          <span>Order online</span>
        </div>
      </div>

      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg font-display text-xl font-semibold text-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
        >
          Royal Bakery
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClassName}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          {signedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" className={adminLinkClassName}>
                  Admin
                </Link>
              )}
              <Link href="/orders" className={linkClassName}>
                My Orders
              </Link>
              <Link href="/cart" aria-label={cartLabel} className={`${linkClassName} min-w-11 gap-2`}>
                <ShoppingBag aria-hidden="true" size={18} />
                <span className="sr-only">{cartLabel}</span>
                {cartItemCount > 0 && (
                  <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-cocoa px-1 text-xs font-semibold text-cream-alt">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                aria-label="Account"
                className={`${linkClassName} min-w-11 justify-center`}
              >
                <UserRound aria-hidden="true" size={18} />
                <span className="sr-only">Account</span>
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" className="px-3">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClassName}>
                Sign In
              </Link>
              <Link href="/signup" className={primaryLinkClassName}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-cocoa transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 lg:hidden"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="storefront-mobile-navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>

      <div aria-hidden={!mobileMenuOpen} inert={!mobileMenuOpen}>
        <AnimatePresence initial={false}>
          {mobileMenuOpen && (
            <motion.nav
              id="storefront-mobile-navigation"
              aria-label="Mobile navigation"
              className="border-t border-border-warm bg-cream-alt px-4 py-4 lg:hidden"
              initial={{ opacity: 0, y: mobileMenuOffset }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: mobileMenuOffset }}
              transition={{ duration: 0.2 }}
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-1">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${linkClassName} w-full`}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border-warm" />
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${linkClassName} w-full`}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                {signedIn && (
                  <>
                    <Link
                      href="/cart"
                      aria-label={cartLabel}
                      className={`${linkClassName} w-full gap-2`}
                      onClick={closeMobileMenu}
                    >
                      <ShoppingBag aria-hidden="true" size={18} />
                      <span>{cartLabel}</span>
                    </Link>
                    <form action={signOut} className="pt-2">
                      <Button type="submit" variant="ghost" className="w-full justify-start px-2">
                        Sign out
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
