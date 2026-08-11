import Image from "next/image";
import Link from "next/link";

export function AboutTeaser() {
  return (
    <section className="bg-cream-alt">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16">
        <div className="relative overflow-hidden lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src="/images/craft.jpeg"
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
          <div className="absolute bottom-3 right-3 hidden h-28 w-28 flex-col items-center justify-center rounded-[1.5rem] border border-border-warm bg-cream-alt/95 backdrop-blur-sm sm:flex">
            <p className="font-display text-2xl font-medium text-cocoa">500+</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
              Orders
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 lg:pl-4">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-caramel/60" aria-hidden />
            <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel-hover">
              Our craft
            </p>
          </div>
          <h2 className="font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cocoa text-balance sm:text-4xl lg:text-[2.75rem]">
            A bakery menu for everyday orders and celebrations.
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-text-muted sm:text-base">
            Royal Bakery is a neighbourhood bakery with a menu for everyday
            orders and celebrations. Browse the catalogue to see available items.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/about" className="inline-flex min-h-11 items-center justify-center rounded-full bg-cocoa px-7 py-3 text-[13px] font-medium tracking-[0.06em] text-cream-alt shadow-[0_1px_0_rgba(58,26,19,0.08)] transition-colors duration-300 hover:bg-cocoa-dark">
              Read our story
            </Link>
            <Link
              href="/products"
              className="group inline-flex min-h-11 items-center gap-2 border-b border-border-warm pb-0.5 text-[13px] tracking-[0.06em] text-cocoa transition-colors duration-300 hover:border-caramel hover:text-caramel-hover"
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
