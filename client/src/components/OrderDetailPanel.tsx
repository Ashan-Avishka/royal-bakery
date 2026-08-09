import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PayNowButton } from "@/components/PayNowButton";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatPrice } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

export function OrderDetailPanel({ order }: { order: Order }) {
  const canPay =
    (order.paymentStatus === "unpaid" || order.paymentStatus === "failed") &&
    order.status !== "cancelled";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <PaymentStatusBadge status={order.paymentStatus} />
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mb-6 grid grid-cols-1 gap-4 text-sm">
        <div>
          <dt className="text-text-muted">Placed on</dt>
          <dd className="mt-1 font-medium text-cocoa">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Fulfillment</dt>
          <dd className="mt-1 font-medium text-cocoa">
            {order.deliveryAddress
              ? `Delivery — ${order.deliveryAddress}`
              : "Pickup"}
          </dd>
        </div>
      </dl>

      <h3 className="mb-3 font-display text-lg text-cocoa">Items</h3>
      <ul className="flex flex-col gap-3 text-sm text-cocoa">
        {order.items.map((item) => (
          <li
            key={item.productId}
            className="flex justify-between gap-4 border-b border-border-warm/60 pb-3 last:border-0 last:pb-0"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="shrink-0 font-medium">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between border-t border-border-warm pt-4 font-display text-lg font-medium text-cocoa">
        <span>Total</span>
        <span>{formatPrice(order.totalAmount)}</span>
      </div>

      {canPay && (
        <div className="mt-6">
          <PayNowButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
