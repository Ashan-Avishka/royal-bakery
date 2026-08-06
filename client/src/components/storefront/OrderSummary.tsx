import type { ReactNode } from "react";
import Link from "next/link";
import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

export interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  action?: ReactNode;
  editHref?: string;
}

export function OrderSummary({
  items,
  subtotal,
  action,
  editHref,
}: OrderSummaryProps) {
  return (
    <section className="rounded-lg border border-border-warm bg-cream-alt p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl text-cocoa">Order summary</h2>
        {editHref ? (
          <Link
            href={editHref}
            className="inline-flex min-h-11 items-center text-sm font-medium text-cocoa underline-offset-4 hover:text-cocoa-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
          >
            Edit cart
          </Link>
        ) : null}
      </div>

      <ul className="mt-5 space-y-3 text-sm text-cocoa">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-start justify-between gap-4"
          >
            <span className="min-w-0 break-words">
              {item.name} x {item.quantity}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border-warm pt-5 text-cocoa">
        <span className="font-medium">Subtotal</span>
        <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
      </div>

      {action ? <div className="mt-6 [&>*]:w-full">{action}</div> : null}
    </section>
  );
}
