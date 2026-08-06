import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { listCategories, listProducts } from "@/lib/catalog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; search?: string }>;
}) {
  const { categoryId, search } = await searchParams;

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ categoryId, search }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-cocoa">Our menu</h1>

      <div className="mb-8">
        <ProductFilters
          categories={categories}
          activeCategoryId={categoryId}
          activeSearch={search}
          resultCount={products.length}
        />
      </div>

      {products.length === 0 ? (
        <p className="text-text-muted">
          No products match your filters. Try a different search or category.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
