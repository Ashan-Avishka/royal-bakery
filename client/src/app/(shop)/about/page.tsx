import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { SITE_CONTACT } from "@/lib/site";

export default function AboutPage() {
  return (
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-honey/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-caramel/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="relative overflow-hidden lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1400&q=80"
              alt="Baker working dough in a warm bakery kitchen"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-cocoa-dark/30 to-transparent"
              aria-hidden
            />
          </div>
          <div
            className="pointer-events-none absolute bottom-4 right-4 hidden h-28 w-28 border border-border-warm sm:block"
            aria-hidden
          />
        </div>

        <div className="lg:col-span-6 lg:pl-2">
          <div className="mb-6">
            <BrandLogo size="md" />
          </div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-caramel/60" aria-hidden />
            <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">
              Our story
            </p>
          </div>

          <h1 className="font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cocoa text-balance sm:text-4xl lg:text-[2.75rem]">
            About Royal Bakery
          </h1>

          <div className="mt-6 flex flex-col gap-5 text-[15px] leading-relaxed text-text-muted sm:text-base">
            <p>
              Royal Bakery has spent years perfecting the everyday craft of good
              baking — cakes made to order, pastries baked fresh each morning,
              and bread that never sees a shortcut. What started as a small
              neighbourhood counter in Medawala, Harispaththuwa has grown into a
              bakery people plan celebrations around.
            </p>
            <p>
              Everything on our menu is made in-house, in small batches, using
              real butter, real chocolate, and no artificial shortcuts. Our team
              of bakers starts before sunrise so that whatever you order is as
              fresh as it can possibly be.
            </p>
            <p>
              Visit us at {SITE_CONTACT.address}, or write to{" "}
              <a
                href={`mailto:${SITE_CONTACT.email}`}
                className="text-caramel transition-colors hover:text-caramel-hover"
              >
                {SITE_CONTACT.email}
              </a>
              .
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/products">
              <Button className="px-7 py-3 text-[13px] tracking-[0.06em]">
                Browse the menu
              </Button>
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 border-b border-border-warm pb-0.5 text-[13px] tracking-[0.06em] text-cocoa transition-colors duration-300 hover:border-caramel hover:text-caramel"
            >
              Back to home
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
