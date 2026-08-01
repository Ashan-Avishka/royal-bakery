"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        if ("disabled" in item && item.disabled) {
          return (
            <span
              key={item.href}
              className="rounded-lg px-3 py-2 text-sm text-text-muted/60"
              title="Coming soon"
            >
              {item.label}
            </span>
          );
        }

        const active = isActive(
          pathname,
          item.href,
          "exact" in item ? item.exact : false
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-honey-light text-cocoa"
                : "text-cocoa hover:bg-honey-light/60"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
