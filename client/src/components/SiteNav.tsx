"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Menu" },
  { href: "/about", label: "About" },
];

interface SiteNavProps {
  isSignedIn: boolean;
  isAdmin?: boolean;
  cartItemCount: number;
}

export function SiteNav({ isSignedIn, isAdmin = false, cartItemCount }: SiteNavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = pathname === "/" && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        overHero
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border-warm/70 bg-cream-alt/90 shadow-[0_8px_30px_-20px_rgba(58,26,19,0.35)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:py-3.5">
        <Link
          href="/"
          className={`inline-flex items-center gap-2.5 transition-colors duration-300 sm:gap-3 ${
            overHero
              ? "text-cream hover:text-honey"
              : "text-cocoa hover:text-caramel"
          }`}
        >
          <BrandLogo size="sm" href={null} priority />
          <span className="font-display text-lg font-medium tracking-[0.04em] sm:text-xl">
            Royal Bakery
          </span>
        </Link>

        <nav className="hidden items-center gap-9 text-[13px] font-medium tracking-[0.04em] sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-300 ${
                overHero
                  ? "text-cream/80 hover:text-honey"
                  : "text-cocoa/80 hover:text-caramel"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {isSignedIn ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className={`text-[13px] font-medium tracking-[0.04em] transition-colors duration-300 ${
                    overHero
                      ? "text-cream/80 hover:text-honey"
                      : "text-cocoa/80 hover:text-caramel"
                  }`}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/orders"
                    className={`hidden text-[13px] font-medium tracking-[0.04em] transition-colors duration-300 sm:inline ${
                      overHero
                        ? "text-cream/80 hover:text-honey"
                        : "text-cocoa/80 hover:text-caramel"
                    }`}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/cart"
                    className={`relative text-[13px] font-medium tracking-[0.04em] transition-colors duration-300 ${
                      overHero
                        ? "text-cream/80 hover:text-honey"
                        : "text-cocoa/80 hover:text-caramel"
                    }`}
                  >
                    Cart
                    {cartItemCount > 0 && (
                      <span
                        className={`absolute -right-3.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                          overHero
                            ? "bg-honey text-cocoa-dark"
                            : "bg-caramel text-cream-alt"
                        }`}
                      >
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/account"
                    className={`hidden text-[13px] font-medium tracking-[0.04em] transition-colors duration-300 sm:inline ${
                      overHero
                        ? "text-cream/80 hover:text-honey"
                        : "text-cocoa/80 hover:text-caramel"
                    }`}
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
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-[13px] font-medium tracking-[0.04em] transition-colors duration-300 ${
                  overHero
                    ? "text-cream/80 hover:text-honey"
                    : "text-cocoa/80 hover:text-caramel"
                }`}
              >
                Sign in
              </Link>
              <Link href="/signup">
                <Button
                  className={`px-5 py-2 text-[12px] tracking-[0.06em] ${
                    overHero
                      ? "bg-honey text-cocoa-dark hover:bg-honey-light"
                      : ""
                  }`}
                >
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
