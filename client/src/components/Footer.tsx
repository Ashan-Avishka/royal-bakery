import Link from "next/link";

const footerGroups = [
  {
    title: "Shop",
    links: [
      { href: "/", label: "Home" },
      { href: "/products", label: "Products" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "Account" },
      { href: "/orders", label: "My Orders" },
      { href: "/login", label: "Sign In" },
    ],
  },
  {
    title: "About",
    links: [{ href: "/about", label: "Our bakery" }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-warm bg-cream-alt">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="font-display text-lg text-cocoa">Royal Bakery</p>
          <p className="text-sm text-text-muted">Freshly baked in Colombo, Sri Lanka.</p>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h2 className="mb-3 text-sm font-semibold text-cocoa">{group.title}</h2>
            <ul className="space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="-mx-2 inline-flex min-h-11 items-center rounded-lg px-2 text-text-muted transition-colors hover:text-caramel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border-warm">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-text-muted sm:px-6">
          &copy; {new Date().getFullYear()} Royal Bakery. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
