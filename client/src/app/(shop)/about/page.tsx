import Link from "next/link";
import { ArrowRight, CalendarClock, PackageCheck, Store } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/storefront/SectionHeading";

const valueItems = [
  {
    title: "Browse the menu online",
    description: "Explore cakes, pastries, and bread in one place.",
    icon: Store,
  },
  {
    title: "See current availability",
    description: "Check the catalog before choosing your favourites.",
    icon: PackageCheck,
  },
  {
    title: "Order ahead",
    description: "Choose what you need and place your order online.",
    icon: CalendarClock,
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border-warm bg-cocoa text-cream-alt">
        <Reveal className="mx-auto max-w-6xl px-6 py-14 sm:py-16 lg:py-20">
          <p className="text-sm font-semibold text-honey">Colombo bakery</p>
          <h1 className="mt-3 max-w-4xl text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            About Royal Bakery
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-cream sm:text-lg">
            Cakes, pastries, and bread for everyday cravings and meaningful
            celebrations in Colombo.
          </p>
        </Reveal>
      </section>

      <section className="bg-cream">
        <Reveal className="mx-auto grid max-w-6xl gap-7 px-6 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <SectionHeading
            eyebrow="Our story"
            title="A Colombo bakery for everyday cravings and celebrations"
          />
          <div className="max-w-2xl space-y-5 text-pretty leading-7 text-text-muted">
            <p>
              Royal Bakery brings cakes, pastries, and bread together for the
              moments Colombo plans around, from something for today to a cake
              for a celebration.
            </p>
            <p>
              The menu is made for both the everyday and the memorable, with a
              range of bakery favourites to explore before choosing what suits
              the occasion.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-border-warm bg-cream-alt">
        <Reveal className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <SectionHeading
            title="The bakery counter, online"
            description="Explore the Royal Bakery menu, check current availability, and order ahead from one place."
          />

          <div className="mt-9 grid gap-7 sm:grid-cols-3 sm:gap-0">
            {valueItems.map(({ title, description, icon: Icon }, index) => (
              <div
                key={title}
                className={`flex gap-4 sm:px-6 ${
                  index > 0 ? "sm:border-l sm:border-border-warm" : "sm:pl-0"
                } ${index === valueItems.length - 1 ? "sm:pr-0" : ""}`}
              >
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-caramel-hover"
                />
                <div>
                  <h3 className="font-display text-lg text-cocoa">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-honey-light">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-2xl text-cocoa sm:text-3xl">
              Find something for today or a celebration
            </h2>
            <p className="mt-2 text-text-muted">
              Explore cakes, pastries, and bread on the current menu.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-alt transition-colors hover:bg-cocoa-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
          >
            Browse the menu
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
