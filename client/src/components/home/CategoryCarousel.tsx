"use client";

import Link from "next/link";
import { Carousel } from "@/components/home/Carousel";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { Category } from "@/lib/catalog";

const accents = [
  "from-[#f7e6c8] via-honey-light to-honey/70",
  "from-honey-light via-[#f0d4a8] to-caramel/30",
  "from-cream-alt via-honey-light/80 to-[#f5d9a8]",
  "from-[#f3e0c0] via-honey/50 to-honey-light",
];

interface CategoryCarouselProps {
  categories: Category[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <SectionHeader
        eyebrow="Collections"
        title="Shop by craving"
        description="Celebration cakes, morning breads, and afternoon pastries — curated for every moment."
        href="/products"
        linkLabel="View full menu"
      />

      <Carousel
        ariaLabel="Product categories"
        itemClassName="w-[68%] sm:w-[40%] md:w-[28%] lg:w-[22%]"
      >
        {categories.map((category, i) => (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className="group relative block overflow-hidden rounded-sm"
          >
            <div
              className={`relative aspect-[3/4] bg-gradient-to-br ${accents[i % accents.length]} transition-transform duration-700 ease-out group-hover:scale-[1.02]`}
            >
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 20%, #3a1a13 0.6px, transparent 0.8px)",
                  backgroundSize: "12px 12px",
                }}
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                <span className="font-display text-[11px] tracking-[0.22em] text-cocoa/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-medium text-cocoa sm:text-[1.35rem]">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-text-muted">
                      {category.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.08em] text-caramel opacity-70 transition-all duration-300 group-hover:opacity-100">
                    Explore
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
