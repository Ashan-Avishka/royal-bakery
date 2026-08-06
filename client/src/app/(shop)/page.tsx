import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  PackageCheck,
  Store,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import { listCategories, listProducts } from "@/lib/catalog";

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

const primaryLinkClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-alt transition-colors hover:bg-cocoa-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2";

const secondaryLinkClasses =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border-warm bg-cream-alt px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:border-caramel hover:bg-honey-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);

  const featured = products.slice(0, 8);
  const heroProduct = featured.find((product) => product.imageUrl);

  return (
    <>
      <section className="border-b border-border-warm bg-honey-light/40">
        <div className="mx-auto grid max-w-6xl items-center gap-9 px-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] lg:gap-14 lg:py-14">
          <Reveal>
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-cocoa">Colombo bakery</p>
              <h1 className="mt-3 text-balance font-display text-5xl font-semibold leading-tight text-cocoa sm:text-6xl">
                Royal Bakery
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-text-muted sm:text-lg">
                Cakes, pastries, and bread made for everyday cravings and
                meaningful celebrations in Colombo.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products" className={primaryLinkClasses}>
                  Shop the menu
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link href="/about" className={secondaryLinkClasses}>
                  Our story
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            {heroProduct?.imageUrl ? (
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-honey-light lg:aspect-[4/3]">
                <Image
                  src={heroProduct.imageUrl}
                  alt={`${heroProduct.name} from Royal Bakery`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-cocoa/90 px-4 py-3 text-sm font-medium text-cream-alt">
                  {heroProduct.name}
                </div>
              </div>
            ) : (
              <div className="flex aspect-[16/10] flex-col justify-between rounded-lg border border-border-warm bg-cream-alt p-6 sm:p-8 lg:aspect-[4/3]">
                <p className="font-display text-2xl text-cocoa">The Royal Bakery menu</p>
                <div className="divide-y divide-border-warm border-y border-border-warm font-display text-xl text-cocoa sm:text-2xl">
                  <p className="py-3">Cakes</p>
                  <p className="py-3">Pastries</p>
                  <p className="py-3">Bread</p>
                </div>
                <p className="text-sm text-text-muted">Made for Colombo</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border-warm bg-cream-alt">
        <Reveal className="mx-auto max-w-6xl px-6 py-9 sm:py-10">
          <SectionHeading
            title="Find your favourite"
            description="Start with a bakery category, then see what is currently available."
          />
          {categories.length > 0 && (
            <nav aria-label="Product categories" className="mt-6 flex flex-wrap gap-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?categoryId=${category.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border-warm bg-cream px-4 py-2 text-sm font-semibold text-cocoa transition-colors hover:border-caramel hover:text-caramel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          )}
        </Reveal>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <Reveal>
            <SectionHeading
              title="Featured from the bakery"
              description="A closer look at a few favourites from the current menu."
              action={
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-caramel-hover transition-colors hover:text-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                >
                  View the menu
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              }
            />
          </Reveal>

          <div className="mt-8">
            {featured.length === 0 ? (
              <EmptyState
                title="The menu is unavailable right now"
                description="We cannot show the current catalog here at the moment."
                actionHref="/products"
                actionLabel="View the full menu"
              />
            ) : (
              <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {featured.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                  />
                ))}
              </StaggerGrid>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-border-warm bg-cream-alt">
        <Reveal className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-0">
            {valueItems.map(({ title, description, icon: Icon }, index) => (
              <div
                key={title}
                className={`flex gap-4 sm:px-6 ${
                  index > 0 ? "sm:border-l sm:border-border-warm" : "sm:pl-0"
                } ${index === valueItems.length - 1 ? "sm:pr-0" : ""}`}
              >
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-caramel" />
                <div>
                  <h2 className="font-display text-lg text-cocoa">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-cocoa text-cream-alt">
        <Reveal className="mx-auto grid max-w-6xl gap-7 px-6 py-14 sm:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-honey">Our story</p>
            <h2 className="mt-3 text-balance font-display text-3xl leading-tight sm:text-4xl">
              A bakery for the everyday and the memorable
            </h2>
            <p className="mt-4 max-w-xl text-pretty leading-7 text-cream">
              Meet Royal Bakery in Colombo and read the story behind the menu
              made for daily cravings and meaningful celebrations.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-honey bg-transparent px-5 py-2.5 text-sm font-semibold text-cream-alt transition-colors hover:bg-honey hover:text-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey focus-visible:ring-offset-2 focus-visible:ring-offset-cocoa"
          >
            Discover our story
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>
      </section>

      {featured.length > 0 && (
        <section className="bg-honey-light">
          <Reveal className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-cocoa sm:text-3xl">
                Choose something for today
              </h2>
              <p className="mt-2 text-text-muted">Explore the current Royal Bakery menu.</p>
            </div>
            <Link href="/products" className={primaryLinkClasses}>
              Shop all bakes
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Reveal>
        </section>
      )}
    </>
  );
}
