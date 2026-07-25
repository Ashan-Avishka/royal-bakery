import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, getProduct } from "@/lib/catalog";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const outOfStock = product.stockQuantity <= 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-honey-light">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            No photo yet
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl text-cocoa">{product.name}</h1>
        <p className="text-xl font-medium text-caramel">
          {formatPrice(product.price)}
        </p>

        <div className="flex gap-2">
          {outOfStock ? (
            <Badge tone="warning">Out of stock</Badge>
          ) : (
            <Badge tone="success">In stock</Badge>
          )}
        </div>

        {product.description && (
          <p className="leading-relaxed text-text-muted">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}
