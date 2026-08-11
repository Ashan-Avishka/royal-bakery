"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reports", label: "Reports" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSection(pathname: string) {
  return navItems.find((item) =>
    isActive(pathname, item.href, "exact" in item ? item.exact : false)
  )?.label ?? "Admin";
}

function NavLinks({ closeMenu }: { closeMenu?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const active = isActive(
          pathname,
          item.href,
          "exact" in item ? item.exact : false
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={closeMenu}
            className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-honey-light text-cocoa"
                : "text-cocoa hover:bg-honey-light/60"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function AccountActions({ email, closeMenu }: { email: string; closeMenu?: () => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-border-warm pt-4">
      <p className="break-all text-xs text-text-muted">{email}</p>
      <Link
        href="/"
        onClick={closeMenu}
        className="flex min-h-11 items-center text-sm font-medium text-cocoa transition-colors hover:text-caramel-hover"
      >
        View storefront
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="ghost" className="w-full justify-start px-0">
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminNav({ mode, email }: { mode: "mobile" | "desktop"; email: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (wasOpenRef.current && pathname) closeMenu(true);
    wasOpenRef.current = isOpen;
  }, [closeMenu, isOpen, pathname]);

  useEffect(() => {
    if (mode !== "mobile" || !isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeMenu, isOpen, mode]);

  if (mode === "desktop") {
    return (
      <div className="flex h-full flex-col gap-6">
        <div>
          <Link href="/admin" className="font-display text-lg font-semibold text-cocoa">
            Royal Bakery
          </Link>
          <p className="mt-0.5 text-xs text-text-muted">Admin</p>
        </div>
        <nav aria-label="Admin navigation" className="flex flex-col gap-1">
          <NavLinks />
        </nav>
        <div className="mt-auto">
          <AccountActions email={email} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4">
        <Link href="/admin" className="inline-flex min-h-11 min-w-0 items-center font-display text-base font-semibold text-cocoa">
          Royal Bakery <span className="text-text-muted">/ {currentSection(pathname)}</span>
        </Link>
        <button
          ref={triggerRef}
          type="button"
          aria-controls="admin-mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close admin navigation" : "Open admin navigation"}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-honey-light focus:outline-none focus:ring-2 focus:ring-caramel"
        >
          <span aria-hidden className="text-xl leading-none">{isOpen ? "×" : "☰"}</span>
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-border-warm bg-cream-alt px-4 pb-4 pt-3 motion-reduce:transition-none">
          <nav id="admin-mobile-navigation" aria-label="Admin navigation" className="flex flex-col gap-1">
            <NavLinks closeMenu={() => closeMenu(true)} />
          </nav>
          <AccountActions email={email} closeMenu={() => closeMenu(true)} />
        </div>
      )}
    </div>
  );
}
