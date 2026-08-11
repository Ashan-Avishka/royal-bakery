import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { SITE_CONTACT } from "@/lib/site";

export default function AboutPage() {
  return (
    <section className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-honey/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-caramel/10 blur-3xl" aria-hidden />
      <div className="page-container page-section relative grid min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="relative overflow-hidden lg:col-span-6"><div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]"><Image src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1400&q=80" alt="Baker working dough in a bakery kitchen" fill sizes="(min-width: 1024px) 40vw, calc(100vw - 2rem)" className="object-cover" priority /></div></div>
        <div className="min-w-0 lg:col-span-6 lg:pl-2">
          <div className="mb-6"><BrandLogo size="md" /></div>
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">Our story</p>
          <h1 className="mt-4 break-words font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cocoa sm:text-4xl">About Royal Bakery</h1>
          <h2 className="mt-7 font-display text-2xl text-cocoa">A Colombo bakery for everyday cravings and celebrations</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-muted sm:text-base">Royal Bakery brings its menu online so customers can browse products, check what is currently listed, and plan an order around the occasion.</p>
          <h2 className="mt-7 font-display text-2xl text-cocoa">The bakery counter, online</h2>
          <ul className="mt-4 grid gap-3 text-sm text-text-muted"><li>Browse the menu online</li><li>See current availability</li><li>Order ahead</li></ul>
          <p className="mt-6 break-words text-sm leading-relaxed text-text-muted">Visit us at {SITE_CONTACT.address}, or write to <a href={`mailto:${SITE_CONTACT.email}`} className="text-caramel transition-colors hover:text-caramel-hover">{SITE_CONTACT.email}</a>.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"><Link href="/products" className="w-full sm:w-auto"><Button className="w-full px-7 py-3 text-[13px] tracking-[0.06em] sm:w-auto">Browse the menu</Button></Link><Link href="/" className="inline-flex min-h-11 items-center text-[13px] tracking-[0.06em] text-cocoa transition-colors hover:text-caramel">Back to home</Link></div>
        </div>
      </div>
    </section>
  );
}
