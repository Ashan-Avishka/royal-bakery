"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Menu" },
  { href: "/about", label: "About" },
];

export const SITE_HEADER_HEIGHT = "4.75rem";

interface SiteNavProps {
  isSignedIn: boolean;
  isAdmin?: boolean;
  cartItemCount: number;
}

export function SiteNav({ isSignedIn, isAdmin = false, cartItemCount }: SiteNavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const mobileMenuOffset = reducedMotion ? 0 : -8;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset disclosure after navigation.
  useEffect(() => setMobileMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        mobileMenuTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const overHero = pathname === "/" && !scrolled;
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const cartLabel = `Cart, ${cartItemCount} ${cartItemCount === 1 ? "item" : "items"}`;
  const linkClassName = `inline-flex min-h-11 items-center rounded-lg px-3 text-[13px] font-medium tracking-[0.04em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 ${
    overHero
      ? "text-cream/80 hover:text-honey"
      : "text-cocoa/80 hover:text-caramel-hover"
  }`;
  const primaryLinkClassName = `inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-[12px] font-medium tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 ${
    overHero
      ? "bg-honey text-cocoa-dark hover:bg-honey-light"
      : "bg-cocoa text-cream-alt hover:bg-cocoa-dark"
  }`;
  const mobileLinkClassName =
    "inline-flex min-h-11 items-center rounded-lg px-3 text-[13px] font-medium tracking-[0.04em] text-cocoa transition-colors duration-300 hover:text-caramel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2";
  const mobileMenuTriggerClassName = `touch-target inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 md:hidden ${
    overHero
      ? "text-cream hover:text-honey focus-visible:text-honey focus-visible:ring-honey focus-visible:ring-offset-cocoa"
      : "text-cocoa hover:text-caramel-hover focus-visible:text-caramel-hover focus-visible:ring-caramel focus-visible:ring-offset-cream-alt"
  }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        overHero
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border-warm/70 bg-cream-alt/90 shadow-[0_8px_30px_-20px_rgba(58,26,19,0.35)] backdrop-blur-md"
      }`}
      style={{ "--site-header-height": SITE_HEADER_HEIGHT } as CSSProperties}
    >
      <div className="safe-x mx-auto flex h-[var(--site-header-height)] max-w-6xl items-center justify-between gap-3 md:px-6">
        <Link
          href="/"
          className={`inline-flex min-w-0 items-center gap-2.5 transition-colors duration-300 sm:gap-3 ${
            overHero
              ? "text-cream hover:text-honey"
              : "text-cocoa hover:text-caramel"
          }`}
        >
          <BrandLogo size="sm" href={null} />
          <span className="font-display text-lg font-medium tracking-[0.04em] sm:text-xl">
            Royal Bakery
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClassName}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {isSignedIn ? (
            <>
              {!isAdmin && (
                <Link
                  href="/cart"
                  aria-label={cartLabel}
                  className={`${linkClassName} min-w-11 justify-center gap-1.5 px-2`}
                >
                  <ShoppingBag aria-hidden="true" size={18} />
                  {cartItemCount > 0 && (
                    <span
                      aria-hidden="true"
                      className={`flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                        overHero
                          ? "bg-honey text-cocoa-dark"
                          : "bg-caramel text-cream-alt"
                      }`}
                    >
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}
              <div className="hidden items-center gap-1 md:flex">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className={linkClassName}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/orders"
                    className={linkClassName}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/account"
                    className={linkClassName}
                  >
                    Account
                  </Link>
                </>
              )}
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  className={`px-3 py-1.5 text-[13px] ${
                    overHero
                      ? "text-cream/90 hover:bg-cream/10 hover:text-honey"
                      : ""
                  }`}
                >
                  Sign out
                </Button>
              </form>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-1 md:flex">
              <Link
                href="/login"
                className={linkClassName}
              >
                Sign in
              </Link>
              <Link href="/signup" className={primaryLinkClassName}>
                Sign up
              </Link>
            </div>
          )}
          <button
            ref={mobileMenuTriggerRef}
            type="button"
            className={mobileMenuTriggerClassName}
            aria-controls="site-mobile-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div aria-hidden={!mobileMenuOpen} inert={!mobileMenuOpen}>
        <AnimatePresence initial={false}>
          {mobileMenuOpen && (
            <motion.nav
              id="site-mobile-navigation"
              aria-label="Mobile navigation"
              className="safe-x border-t border-border-warm/70 bg-cream-alt py-3 text-cocoa md:hidden"
              initial={{ opacity: 0, y: mobileMenuOffset }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: mobileMenuOffset }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-1 md:px-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${mobileLinkClassName} w-full`}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border-warm/70" />
                {isSignedIn ? (
                  <>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className={`${mobileLinkClassName} w-full`}
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/orders"
                          className={`${mobileLinkClassName} w-full`}
                          onClick={closeMobileMenu}
                        >
                          Orders
                        </Link>
                        <Link
                          href="/account"
                          className={`${mobileLinkClassName} w-full`}
                          onClick={closeMobileMenu}
                        >
                          Account
                        </Link>
                      </>
                    )}
                    <form action={signOut} className="pt-2">
                      <Button type="submit" variant="ghost" className="w-full justify-start px-3">
                        Sign out
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={`${mobileLinkClassName} w-full`}
                      onClick={closeMobileMenu}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className={`${primaryLinkClassName} mt-2 w-full`}
                      onClick={closeMobileMenu}
                    >
                      Sign up
                    </Link>
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
