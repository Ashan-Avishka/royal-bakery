import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { EmptyState } from "@/components/storefront/EmptyState";
import { listCategories, listProducts } from "@/lib/catalog";

function getEmptyDescription(categoryId?: string, search?: string) {
  if (categoryId && search) {
    return "No products match this search and category. Clear the filters to browse the full menu.";
  }

  if (search) {
    return "No products match this search. Clear the filters to browse the full menu.";
  }

  if (categoryId) {
    return "No products are available in this category. Clear the filters to browse the full menu.";
  }

  return "There are no products available in the menu right now.";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; search?: string }>;
}) {
  const { categoryId, search } = await searchParams;
  const hasActiveFilters = Boolean(categoryId || search);

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ categoryId, search }),
  ]);

  return (
    <>
      <section className="border-b border-border-warm bg-honey-light/40">
        <div className="mx-auto max-w-6xl px-6 py-9 sm:py-10">
          <div className="max-w-2xl">
            <h1 className="text-balance font-display text-3xl font-semibold text-cocoa sm:text-4xl">
              Our bakery menu
            </h1>
            <p className="mt-3 max-w-xl text-pretty leading-7 text-text-muted">
              Explore cakes, pastries, and bread from the current Royal Bakery menu.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border-warm bg-cream lg:sticky lg:top-24 lg:z-10">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <ProductFilters
            categories={categories}
            activeCategoryId={categoryId}
            activeSearch={search}
            resultCount={products.length}
          />
        </div>
      </section>

      <div className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
          {products.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? "No products found" : "The menu is currently unavailable"}
              description={
                hasActiveFilters
                  ? getEmptyDescription(categoryId, search)
                  : "There are no products available in the menu right now."
              }
              actionHref={hasActiveFilters ? "/products" : "/"}
              actionLabel={hasActiveFilters ? "Clear filters" : "Back to home"}
            />
          ) : (
            <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </StaggerGrid>
          )}
        </div>
      </div>
    </>
  );
}
