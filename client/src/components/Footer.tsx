import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SITE_CONTACT } from "@/lib/site";

const footerLinks = [
  { href: "/products", label: "Menu" },
  { href: "/about", label: "Our bakery" },
  { href: "/orders", label: "Orders" },
  { href: "/cart", label: "Cart" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-warm/70 bg-cream-alt">
      <div className="safe-x mx-auto grid max-w-6xl gap-12 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-3 lg:gap-10">
        <div>
          <Link href="/" aria-label="Royal Bakery home" className="inline-flex min-h-11 min-w-11 items-center px-3"><BrandLogo size="lg" href={null} /></Link>
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-text-muted">Menu and online ordering for Royal Bakery in Harispaththuwa.</p>
        </div>
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.24em] text-caramel-hover">Explore</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {footerLinks.map((link) => <li key={link.href}><Link href={link.href} className="inline-flex min-h-11 min-w-11 items-center px-3 text-[14px] text-cocoa/80 transition-colors duration-300 hover:text-caramel-hover">{link.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.24em] text-caramel-hover">Visit</p>
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-start gap-2.5 text-[14px] leading-relaxed text-text-muted">
              <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-caramel-hover" />
              <p>{SITE_CONTACT.addressLines.map((line) => <span key={line}>{line}<br /></span>)}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail aria-hidden="true" size={16} className="shrink-0 text-caramel-hover" />
              <a href={`mailto:${SITE_CONTACT.email}`} className="inline-flex min-h-11 min-w-11 items-center px-3 text-[14px] text-cocoa/80 transition-colors hover:text-caramel-hover">{SITE_CONTACT.email}</a>
            </div>
            <p className="text-[14px] leading-relaxed text-text-muted/90">Contact the bakery for current opening hours</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border-warm/70"><p className="safe-x mx-auto max-w-6xl py-5 text-[12px] tracking-wide text-text-muted/80 md:px-6">&copy; {new Date().getFullYear()} Royal Bakery. All rights reserved.</p></div>
    </footer>
  );
}
