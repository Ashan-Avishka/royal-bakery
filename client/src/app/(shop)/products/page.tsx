import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { PageHeader } from "@/components/PageHeader";
import { listCategories, listProducts } from "@/lib/catalog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; search?: string }>;
}) {
  const { categoryId, search } = await searchParams;

  const [categories, products] = await Promise.all([
    listCategories().catch(() => []),
    listProducts({ categoryId, search }).catch(() => []),
  ]);

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-honey/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-caramel/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="The menu"
          title={activeCategory ? activeCategory.name : "Our menu"}
          description={
            activeCategory?.description ??
            "Cakes, pastries, breads, and daily bakes — browse what's fresh and order ahead."
          }
        />

        <div className="mb-10">
          <ProductFilters
            categories={categories}
            activeCategoryId={categoryId}
            activeSearch={search}
          />
        </div>

        {products.length === 0 ? (
          <div className="rounded-[1.35rem] border border-dashed border-border-warm bg-cream-alt/70 px-6 py-16 text-center">
            <p className="font-display text-lg text-cocoa">Nothing matched</p>
            <p className="mt-2 text-sm text-text-muted">
              Try a different search or category — the next batch may already be
              on the way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
