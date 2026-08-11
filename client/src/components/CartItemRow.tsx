import Image from "next/image";
import Link from "next/link";
import { removeCartItem, updateCartItemQuantity } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

export function CartItemRow({ item, error }: { item: CartItem; error?: string }) {
  const productHref = `/products/${item.productId}`;

  return (
    <article className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-border-warm/80 py-5 last:border-0 sm:grid-cols-[5rem_minmax(0,1fr)_auto]">
      <Link
        href={productHref}
        aria-label={`View ${item.name}`}
        className="relative size-20 overflow-hidden rounded-[1rem] bg-honey-light/60 ring-1 ring-border-warm/60"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">No photo</div>
        )}
      </Link>

      <div className="min-w-0 break-words">
        <Link href={productHref} className="min-w-0 break-words font-display text-lg font-medium text-cocoa">
          {item.name}
        </Link>
        <p className="mt-0.5 text-sm text-text-muted">{formatPrice(item.price)} each</p>
        <span className="sr-only" aria-hidden="true">{item.name} x {item.quantity}</span>
        {error && (
          <p role="alert" className="mt-3 rounded-[0.85rem] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
        <form action={updateCartItemQuantity} className="flex min-w-0 flex-wrap items-center gap-2">
          <input type="hidden" name="productId" value={item.productId} />
          <label className="sr-only" htmlFor={`quantity-${item.productId}`}>
            Quantity for {item.name}
          </label>
          <input
            id={`quantity-${item.productId}`}
            type="number"
            name="quantity"
            min={1}
            max={item.stockQuantity}
            defaultValue={item.quantity}
            className="min-h-11 w-16 rounded-full border border-text-muted bg-cream-alt px-2 py-1.5 text-center text-base text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30 sm:text-sm"
          />
          <Button type="submit" variant="secondary" className="w-28 w-full px-3 py-1.5 text-xs sm:w-28">
            Update
          </Button>
        </form>
        <p className="font-medium text-cocoa">{formatPrice(item.subtotal)}</p>
        <form action={removeCartItem}>
          <input type="hidden" name="productId" value={item.productId} />
          <Button type="submit" variant="ghost" className="w-28 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 sm:w-28">
            Remove
          </Button>
        </form>
      </div>
    </article>
  );
}
