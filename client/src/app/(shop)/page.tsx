import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/Button";
import { listCategories, listProducts } from "@/lib/catalog";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);

  const featured = products.slice(0, 8);

  return (
    <>
      <section className="border-b border-border-warm bg-honey-light/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-caramel">
            Freshly baked, every day
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold text-cocoa sm:text-5xl">
            Handcrafted cakes, pastries &amp; bread, made with love in
            Colombo.
          </h1>
          <p className="max-w-xl text-text-muted">
            Browse our full menu, place an order online, and pick up warm
            from the oven — or have it delivered to your door.
          </p>
          <Link href="/products">
            <Button className="px-6 py-3 text-base">Browse the menu</Button>
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-6 font-display text-2xl text-cocoa">
            Categories
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="rounded-full border border-border-warm bg-cream-alt px-4 py-2 text-sm font-medium text-cocoa transition-colors hover:border-caramel hover:text-caramel"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-cocoa">
            Featured products
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-caramel hover:text-caramel-hover"
          >
            View all
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-text-muted">
            No products are available right now — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
