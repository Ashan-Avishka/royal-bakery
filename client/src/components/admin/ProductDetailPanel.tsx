import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { stockLabel } from "@/lib/admin/catalog";
import { formatPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";

export function ProductDetailPanel({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  const stock = stockLabel(product.stockQuantity);

  return (
    <div>
      {product.imageUrl && (
        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-honey-light">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="384px"
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone={stock.tone}>{stock.label}</Badge>
        {!product.isAvailable && <Badge tone="muted">Unavailable</Badge>}
      </div>

      <p className="mb-1 break-words font-display text-lg text-cocoa">{product.name}</p>
      <p className="mb-4 text-sm text-text-muted">{formatPrice(product.price)}</p>

      {product.description && (
        <p className="mb-4 break-words text-sm text-cocoa">{product.description}</p>
      )}

      <dl className="mb-6 grid grid-cols-1 gap-3 text-sm">
        {categoryName && (
          <div>
            <dt className="text-text-muted">Category</dt>
            <dd className="font-medium text-cocoa">{categoryName}</dd>
          </div>
        )}
        <div>
          <dt className="text-text-muted">Stock</dt>
          <dd className="font-medium text-cocoa">{product.stockQuantity}</dd>
        </div>
      </dl>

      <Link
        href={`/admin/products/${product.id}`}
        className="inline-flex items-center gap-2 rounded-full bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-caramel-hover"
      >
        Edit product
      </Link>
    </div>
  );
}
