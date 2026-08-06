import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, PackageCheck, UserRound } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, getProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

const primaryActionClasses =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-alt transition-colors hover:bg-cocoa-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 sm:w-auto sm:min-w-44";

const secondaryActionClasses =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border-warm bg-cream-alt px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:border-caramel hover:bg-honey-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 sm:w-fit";

const reassuranceItems = [
  { label: "Current availability shown online", icon: PackageCheck },
  { label: "Order ahead through your account", icon: UserRound },
  { label: "Pickup or delivery selection at checkout", icon: MapPin },
];

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

  const outOfStock = product.stockQuantity <= 0 || !product.isAvailable;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="bg-cream">
      <div className="mx-auto grid max-w-6xl gap-9 px-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start lg:gap-14 lg:py-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-honey-light">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center font-display text-2xl text-cocoa">
              Royal Bakery
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-3">
            {outOfStock ? (
              <Badge tone="warning">Out of stock</Badge>
            ) : (
              <Badge tone="success">In stock</Badge>
            )}
          </div>

          <h1 className="mt-4 text-balance font-display text-3xl font-semibold leading-tight text-cocoa sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-xl font-semibold text-cocoa">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="mt-5 max-w-xl text-pretty leading-7 text-text-muted">
              {product.description}
            </p>
          )}

          <div className="mt-7 border-t border-border-warm pt-6">
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {outOfStock ? (
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-alt opacity-50 sm:w-auto sm:min-w-44"
              >
                Out of stock
              </button>
            ) : user ? (
              <form action={addToCart} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <input type="hidden" name="productId" value={product.id} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quantity" className="text-sm font-medium text-cocoa">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    min={1}
                    max={product.stockQuantity}
                    defaultValue={1}
                    className="min-h-11 w-24 rounded-lg border border-border-warm bg-cream-alt px-3 py-2.5 text-center text-sm text-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                  />
                </div>
                <button type="submit" className={primaryActionClasses}>
                  Add to cart
                </button>
              </form>
            ) : (
              <Link href="/login" className={primaryActionClasses}>
                Sign in to add to cart
              </Link>
            )}

            <Link href="/products" className={`${secondaryActionClasses} mt-3`}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to all products
            </Link>
          </div>

          <ul className="mt-8 divide-y divide-border-warm border-y border-border-warm">
            {reassuranceItems.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="flex min-h-14 items-center gap-3 py-3 text-sm text-cocoa"
              >
                <Icon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-caramel-hover"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
