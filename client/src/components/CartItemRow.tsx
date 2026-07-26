import Image from "next/image";
import { removeCartItem, updateCartItemQuantity } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

export function CartItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border-warm py-4 last:border-0">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-honey-light">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            No photo
          </div>
        )}
      </div>

      <div className="min-w-[10rem] flex-1">
        <p className="font-medium text-cocoa">{item.name}</p>
        <p className="text-sm text-text-muted">{formatPrice(item.price)} each</p>
      </div>

      <form action={updateCartItemQuantity} className="flex items-center gap-2">
        <input type="hidden" name="productId" value={item.productId} />
        <input
          type="number"
          name="quantity"
          min={1}
          max={item.stockQuantity}
          defaultValue={item.quantity}
          className="w-16 rounded-lg border border-border-warm bg-white px-2 py-1.5 text-center text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
        />
        <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
          Update
        </Button>
      </form>

      <p className="w-20 text-right font-medium text-cocoa">
        {formatPrice(item.subtotal)}
      </p>

      <form action={removeCartItem}>
        <input type="hidden" name="productId" value={item.productId} />
        <Button
          type="submit"
          variant="ghost"
          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          Remove
        </Button>
      </form>
    </div>
  );
}
