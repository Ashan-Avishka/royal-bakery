import Image from "next/image";
import Link from "next/link";
import { removeCartItem, updateCartItemQuantity } from "@/app/actions/cart";
import { SubmitButton } from "@/components/storefront/SubmitButton";
import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

export interface CartItemRowProps {
  item: CartItem;
  error?: string;
}

export function CartItemRow({ item, error }: CartItemRowProps) {
  const quantityId = `quantity-${item.productId}`;

  return (
    <article className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-5 border-b border-border-warm py-6 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-x-5">
      <Link
        href={`/products/${item.productId}`}
        aria-label={`View ${item.name}`}
        className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-honey-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 sm:w-24"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 96px, 80px"
            className="object-cover transition-transform duration-300 motion-safe:hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs text-text-muted">
            Royal Bakery
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <Link
          href={`/products/${item.productId}`}
          className="break-words font-medium text-cocoa underline-offset-4 hover:text-caramel-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-sm text-text-muted">
          {formatPrice(item.price)} each
        </p>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span className="text-text-muted">Line total</span>
          <span className="font-semibold tabular-nums text-cocoa">
            {formatPrice(item.subtotal)}
          </span>
        </div>
      </div>

      <div className="col-span-2 flex flex-wrap items-end gap-3 sm:col-start-2 sm:col-span-1">
        <form
          action={updateCartItemQuantity}
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="productId" value={item.productId} />
          <div>
            <label
              htmlFor={quantityId}
              className="mb-1 block text-xs font-medium text-text-muted"
            >
              Quantity <span className="sr-only">for {item.name}</span>
            </label>
            <input
              id={quantityId}
              type="number"
              name="quantity"
              min={1}
              max={item.stockQuantity}
              defaultValue={item.quantity}
              className="min-h-11 w-20 rounded-lg border border-text-muted bg-white px-3 py-2 text-center text-sm tabular-nums text-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
            />
          </div>
          <SubmitButton
            type="submit"
            variant="secondary"
            idleLabel="Update"
            pendingLabel="Updating..."
            className="w-28"
          />
        </form>

        <form action={removeCartItem} className="sm:ml-auto">
          <input type="hidden" name="productId" value={item.productId} />
          <SubmitButton
            type="submit"
            variant="ghost"
            idleLabel="Remove"
            pendingLabel="Removing..."
            className="w-28 text-red-700 hover:bg-red-50"
          />
        </form>
      </div>

      {error ? (
        <p
          role="alert"
          className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-start-2 sm:col-span-1"
        >
          {error}
        </p>
      ) : null}
    </article>
  );
}
