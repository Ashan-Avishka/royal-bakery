import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import {
  listAdminCategories,
  listAdminProducts,
  LOW_STOCK_THRESHOLD,
  stockLabel,
} from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; search?: string; lowStock?: string }>;
}) {
  const { categoryId, search, lowStock } = await searchParams;
  const session = await requireAdminSession();
  const [products, categories] = await Promise.all([
    listAdminProducts(session.accessToken, {
      categoryId: categoryId || undefined,
      search: search || undefined,
    }),
    listAdminCategories(session.accessToken),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const visible =
    lowStock === "1"
      ? products.filter((p) => p.stockQuantity <= LOW_STOCK_THRESHOLD)
      : products;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-cocoa">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-caramel-hover"
        >
          Add product
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="search"
          placeholder="Search products…"
          defaultValue={search ?? ""}
          className="min-w-[12rem] flex-1 rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
        />
        <select
          name="categoryId"
          defaultValue={categoryId ?? ""}
          className="rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-cocoa">
          <input
            type="checkbox"
            name="lowStock"
            value="1"
            defaultChecked={lowStock === "1"}
            className="size-4 rounded border-border-warm text-caramel focus:ring-caramel"
          />
          Low stock only
        </label>
        <button
          type="submit"
          className="rounded-full bg-honey-light px-4 py-2 text-sm font-medium text-cocoa hover:bg-honey"
        >
          Filter
        </button>
      </form>

      {visible.length === 0 ? (
        <p className="text-sm text-text-muted">No products match.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
          {visible.map((product) => {
            const stock = stockLabel(product.stockQuantity);
            return (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex flex-col gap-3 py-4 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-cocoa">{product.name}</p>
                    <p className="text-sm text-text-muted">
                      {formatPrice(product.price)}
                      {product.categoryId
                        ? ` · ${categoryName.get(product.categoryId) ?? "Category"}`
                        : ""}
                      {` · Stock ${product.stockQuantity}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={stock.tone}>{stock.label}</Badge>
                    {!product.isAvailable && (
                      <Badge tone="muted">Unavailable</Badge>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
