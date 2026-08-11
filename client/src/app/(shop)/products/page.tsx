import Link from "next/link";
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
  const [categoriesResult, productsResult] = await Promise.allSettled([
    listCategories(),
    listProducts({ categoryId, search }),
  ]);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const categoriesFailed = categoriesResult.status === "rejected";
  const productsFailed = productsResult.status === "rejected";
  const filtersActive = Boolean(categoryId || search);

  return (
    <section className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-honey/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-caramel/10 blur-3xl" aria-hidden />

      <div className="page-container page-section relative min-w-0">
        <PageHeader
          eyebrow="The menu"
          title="Our bakery menu"
          description="Cakes, pastries, breads, and daily bakes — browse what is available and order ahead."
        />
        <div className="mb-10 min-w-0">
          {categoriesFailed && (
            <p role="alert" className="mb-4 rounded-[0.85rem] border border-amber-200 bg-honey-light/50 px-4 py-3 text-sm text-cocoa">
              Categories are temporarily unavailable. You can still search the menu.
            </p>
          )}
          <ProductFilters
            categories={categories}
            activeCategoryId={categoryId}
            activeSearch={search}
            resultCount={productsFailed ? undefined : products.length}
          />
        </div>

        {productsFailed ? (
          <div role="alert" className="rounded-[1.35rem] border border-amber-200 bg-honey-light/40 px-4 py-12 text-center sm:px-6 sm:py-16">
            <h2 className="font-display text-lg text-cocoa">We couldn&apos;t load the menu.</h2>
            <p className="mt-2 text-sm text-text-muted">Please refresh the page or try again shortly.</p>
          </div>
        ) : products.length === 0 ? (
          filtersActive ? (
            <div className="rounded-[1.35rem] border border-dashed border-border-warm bg-cream-alt/70 px-4 py-12 text-center sm:px-6 sm:py-16">
              <h2 className="font-display text-lg text-cocoa">No products found</h2>
              <p className="mt-2 text-sm text-text-muted">No products match this search and category. Clear the filters to browse the full menu.</p>
              <Link href="/products" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-caramel-hover hover:text-cocoa">Clear filters</Link>
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-border-warm bg-cream-alt/70 px-4 py-12 text-center sm:px-6 sm:py-16">
              <h2 className="font-display text-lg text-cocoa">The menu is currently unavailable</h2>
              <p className="mt-2 text-sm text-text-muted">There are no products available in the menu right now.</p>
              <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-caramel-hover hover:text-cocoa">Back to home</Link>
            </div>
          )
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </section>
  );
}
