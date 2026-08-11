// client/src/components/admin/OrderDetailPanel.tsx
import { UpdateOrderStatusForm } from "@/components/admin/UpdateOrderStatusForm";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatPrice } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

export function OrderDetailPanel({ order }: { order: Order }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PaymentStatusBadge status={order.paymentStatus} />
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mb-6 grid grid-cols-1 gap-4 text-sm">
        <div>
          <dt className="text-text-muted">Placed on</dt>
          <dd className="break-words font-medium text-cocoa">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Fulfillment</dt>
          <dd className="font-medium text-cocoa">
            {order.deliveryAddress
              ? `Delivery — ${order.deliveryAddress}`
              : "Pickup"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Order ID</dt>
          <dd className="break-all font-mono text-xs text-cocoa">{order.id}</dd>
        </div>
      </dl>

      <h3 className="mb-3 font-display text-lg text-cocoa">Items</h3>
      <ul className="mb-6 flex flex-col gap-2 border-y border-border-warm py-4 text-sm text-cocoa">
        {order.items.map((item) => (
          <li key={item.productId} className="flex min-w-0 justify-between gap-4">
            <span className="min-w-0 break-words">
              {item.name} × {item.quantity}
            </span>
            <span className="shrink-0">{formatPrice(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mb-8 flex justify-between font-medium text-cocoa">
        <span>Total</span>
        <span>{formatPrice(order.totalAmount)}</span>
      </div>

      <section className="border-t border-border-warm pt-6">
        <h3 className="mb-4 font-display text-lg text-cocoa">Manage status</h3>
        <UpdateOrderStatusForm orderId={order.id} currentStatus={order.status} />
      </section>
    </div>
  );
}
