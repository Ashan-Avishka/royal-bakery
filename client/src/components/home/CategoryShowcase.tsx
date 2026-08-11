import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { Category } from "@/lib/catalog";

const categoryImagery = [
  { image: "/images/cakes.jpg", alt: "Layered celebration cake" },
  { image: "/images/bread.jpg", alt: "Artisan bread" },
  { image: "/images/pastries.jpg", alt: "Golden bakery pastries" },
  { image: "/images/rolls.jpg", alt: "Crispy bakery rolls" },
  { image: "/images/patties.jpg", alt: "Golden short-eat patties" },
  { image: "/images/rotti.jpg", alt: "Soft bakery rotti" },
  { image: "/images/sweets.jpg", alt: "Tea-time bakery sweets" },
  { image: "/images/bun.jpeg", alt: "Fresh bakery buns" },
];

/** Extra collections shown when the database has fewer categories. */
const curatedCollections = [
  {
    name: "Breads",
    description: "Soft sandwich loaves and everyday breads",
    search: "bread",
  },
  {
    name: "Buns",
    description: "Sweet and savoury buns",
    search: "bun",
  },
  {
    name: "Cakes",
    description: "Classic Sri Lankan bakery cakes",
    search: "cake",
  },
  {
    name: "Rolls",
    description: "Crispy bakery rolls",
    search: "roll",
  },
  {
    name: "Patties",
    description: "Golden short-eat patties for tea time",
    search: "pattie",
  },
  {
    name: "Rotti",
    description: "Soft bakery rotti with classic fillings",
    search: "rotti",
  },
  {
    name: "Pastries",
    description: "Flaky pastries and bakery short eats",
    search: "pastry",
  },
  {
    name: "Sweets",
    description: "Tea-time sweets and soft bakery treats",
    search: "sweet",
  },
];

type ShowcaseItem = {
  key: string;
  name: string;
  description: string | null;
  href: string;
};

function pickImage(name: string, index: number) {
  const n = name.toLowerCase();
  if (n.includes("cake") || n.includes("gateau") || n.includes("cupcake"))
    return categoryImagery[0]!;
  if (n.includes("bread") || n.includes("loaf")) return categoryImagery[1]!;
  if (n.includes("pastr") || n.includes("croissant") || n.includes("danish"))
    return categoryImagery[2]!;
  if (n.includes("bun")) return categoryImagery[7]!;
  if (n.includes("roll")) return categoryImagery[3]!;
  if (n.includes("pattie") || n.includes("patty")) return categoryImagery[4]!;
  if (n.includes("rotti") || n.includes("roti")) return categoryImagery[5]!;
  if (n.includes("sweet") || n.includes("donut") || n.includes("doughnut") || n.includes("muffin") || n.includes("tart"))
    return categoryImagery[6]!;
  return categoryImagery[index % categoryImagery.length]!;
}

function buildShowcaseItems(categories: Category[]): ShowcaseItem[] {
  const fromDb: ShowcaseItem[] = categories.map((category) => ({
    key: category.id,
    name: category.name,
    description: category.description,
    href: `/products?categoryId=${category.id}`,
  }));

  const existingNames = new Set(
    fromDb.map((item) => item.name.trim().toLowerCase())
  );

  const extras: ShowcaseItem[] = curatedCollections
    .filter((item) => !existingNames.has(item.name.toLowerCase()))
    .map((item) => ({
      key: `curated-${item.search}`,
      name: item.name,
      description: item.description,
      href: `/products?search=${encodeURIComponent(item.search)}`,
    }));

  return [...fromDb, ...extras];
}

interface CategoryShowcaseProps {
  categories: Category[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const items = buildShowcaseItems(categories);
  if (items.length === 0) return null;

  const featured = items[0]!;
  const side = items.slice(1, 4);
  const more = items.slice(4);
  const featuredVisual = pickImage(featured.name, 0);

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="ambient-blur pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-honey/30 blur-3xl float-slow"
        aria-hidden
      />
      <div
        className="ambient-blur pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-caramel/15 blur-3xl float-slower"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Collections"
          title="Shop by craving"
          description="Explore bakery categories including cakes, breads, pastries, and more."
          href="/products"
          linkLabel="View full menu"
        />

        <div className="grid items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
          <Link
            href={featured.href}
            className="group relative isolate min-h-[360px] overflow-hidden rounded-[1.75rem] lg:col-span-7 lg:min-h-[560px]"
          >
            <Image
              src={featuredVisual.image}
              alt={featuredVisual.alt}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-105"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-cocoa-dark/90 via-cocoa-dark/35 to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-cocoa-dark/40 to-transparent"
              aria-hidden
            />

            <div className="absolute left-6 top-6 rounded-full border border-cream/25 bg-cream/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cream backdrop-blur-md">
              Signature
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-display text-[11px] uppercase tracking-[0.24em] text-honey/80">
                Start here
              </p>
              <h3 className="mt-2 font-display text-3xl font-medium text-cream sm:text-4xl">
                {featured.name}
              </h3>
              {featured.description && (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-honey-light/80">
                  {featured.description}
                </p>
              )}
              <span className="mt-5 inline-flex items-center gap-2 text-[12px] tracking-[0.1em] text-honey transition-transform duration-300 group-hover:translate-x-1">
                Explore collection →
              </span>
            </div>
          </Link>

          <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-5">
            {side.map((category, i) => {
              const visual = pickImage(category.name, i + 1);
              const flip = i % 2 === 1;

              return (
                <Link
                  key={category.key}
                  href={category.href}
                  className={`elevated-surface group relative flex min-h-[150px] flex-1 items-center gap-4 overflow-hidden rounded-[1.5rem] border border-border-warm/80 bg-cream-alt/90 p-4 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.35)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(58,26,19,0.4)] motion-reduce:transition-none sm:p-5 ${
                    flip ? "flex-row-reverse text-right" : "flex-row"
                  }`}
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.15rem] sm:h-28 sm:w-28">
                    <Image
                      src={visual.image}
                      alt={visual.alt}
                      fill
                      sizes="140px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[10px] uppercase tracking-[0.22em] text-caramel-hover">
                      Collection
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium text-cocoa sm:text-xl">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-text-muted sm:text-[13px]">
                        {category.description}
                      </p>
                    )}
                    <span className="mt-2 inline-flex text-[12px] tracking-[0.08em] text-caramel-hover transition-opacity">
                      Browse →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {more.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {more.map((category, i) => {
              const visual = pickImage(category.name, i + 4);

              return (
                <Link
                  key={category.key}
                  href={category.href}
                  className="group relative isolate min-h-[170px] overflow-hidden rounded-[1.35rem] sm:min-h-[200px]"
                >
                  <Image
                    src={visual.image}
                    alt={visual.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-cocoa-dark/85 via-cocoa-dark/30 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="font-display text-[10px] uppercase tracking-[0.2em] text-honey/75">
                      Collection
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium text-cream sm:text-xl">
                      {category.name}
                    </h3>
                    <span className="mt-2 inline-flex text-[11px] tracking-[0.08em] text-honey/90 opacity-80 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
                      Browse →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
