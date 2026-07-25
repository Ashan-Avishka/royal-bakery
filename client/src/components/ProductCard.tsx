import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stockQuantity <= 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square bg-honey-light">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              No photo yet
            </div>
          )}
          {outOfStock && (
            <Badge tone="warning" className="absolute right-3 top-3">
              Out of stock
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1 p-4">
          <h3 className="font-display text-lg text-cocoa">{product.name}</h3>
          <p className="text-sm font-medium text-caramel">
            {formatPrice(product.price)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
