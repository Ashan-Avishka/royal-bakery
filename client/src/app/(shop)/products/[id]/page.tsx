import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCart } from "@/app/actions/cart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice, getProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const outOfStock = product.stockQuantity <= 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {user ? (
          outOfStock ? (
            <Button disabled className="w-fit px-6 py-3">
              Out of stock
            </Button>
          ) : (
            <form action={addToCart} className="flex items-center gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <input
                type="number"
                name="quantity"
                min={1}
                max={product.stockQuantity}
                defaultValue={1}
                className="w-20 rounded-lg border border-border-warm bg-white px-3 py-2.5 text-center text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
              />
              <Button type="submit" className="px-6 py-3">
                Add to cart
              </Button>
            </form>
          )
        ) : (
          <Link
            href="/login"
            className="w-fit font-medium text-caramel hover:text-caramel-hover"
          >
            Sign in to add to cart
          </Link>
        )}
      </div>
    </div>
  );
}
