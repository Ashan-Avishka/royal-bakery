"use client";

import { ProductCard } from "@/components/ProductCard";
import { AutoCarousel } from "@/components/home/AutoCarousel";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { Product } from "@/lib/catalog";

interface ProductCarouselProps {
  products: Product[];
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  emptyMessage?: string;
  tone?: "default" | "soft";
}

export function ProductCarousel({
  products,
  eyebrow,
  title,
  description,
  href = "/products",
  linkLabel = "View all",
  emptyMessage = "No products are available right now — check back soon.",
  tone = "default",
}: ProductCarouselProps) {
  return (
    <section
      className={`relative ${
        tone === "soft"
          ? "bg-gradient-to-b from-honey-light/35 via-cream-alt/80 to-cream"
          : ""
      }`}
    >
      {tone === "soft" && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-caramel/10 blur-3xl" />
          <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-honey/40 blur-3xl" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          href={href}
          linkLabel={linkLabel}
        />

        {products.length === 0 ? (
          <p className="text-[15px] text-text-muted">{emptyMessage}</p>
        ) : (
          <AutoCarousel ariaLabel={title}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AutoCarousel>
        )}
      </div>
    </section>
  );
}
