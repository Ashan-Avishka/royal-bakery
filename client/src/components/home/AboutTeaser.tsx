import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AboutTeaser() {
  return (
    <section className="bg-cream-alt">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16">
        <div className="relative overflow-hidden lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <Image
              src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1400&q=80"
              alt="Baker working dough in a warm bakery kitchen"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-cocoa-dark/25 to-transparent"
              aria-hidden
            />
          </div>
          <div
            className="pointer-events-none absolute bottom-3 right-3 hidden h-28 w-28 border border-border-warm sm:block"
            aria-hidden
          />
        </div>

        <div className="lg:col-span-6 lg:pl-4">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-caramel/60" aria-hidden />
            <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">
              Our craft
            </p>
          </div>
          <h2 className="font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cocoa text-balance sm:text-4xl lg:text-[2.75rem]">
            Real butter. Real chocolate.{" "}
            <span className="italic text-caramel">No shortcuts.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-text-muted sm:text-base">
            Royal Bakery grew from a neighbourhood counter into the bakery
            people plan celebrations around. Everything is still made in-house,
            in small batches, by bakers who start before sunrise.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/about">
              <Button className="px-7 py-3 text-[13px] tracking-[0.06em]">
                Read our story
              </Button>
            </Link>
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 border-b border-border-warm pb-0.5 text-[13px] tracking-[0.06em] text-cocoa transition-colors duration-300 hover:border-caramel hover:text-caramel"
            >
              Browse the menu
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
