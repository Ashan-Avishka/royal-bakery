import Link from "next/link";
import { notFound } from "next/navigation";
import { UpdateOrderStatusForm } from "@/components/admin/UpdateOrderStatusForm";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { getAdminOrder } from "@/lib/admin/orders";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminSession();
  const order = await getAdminOrder(session.accessToken, id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
      <Link
        href="/admin/orders"
        className="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-caramel-hover hover:text-cocoa"
      >
        ← All orders
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-cocoa">Order details</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <dl className="mb-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div className="min-w-0">
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
        <div className="min-w-0">
          <dt className="text-text-muted">Fulfillment</dt>
          <dd className="break-words font-medium text-cocoa">
            {order.deliveryAddress
              ? `Delivery — ${order.deliveryAddress}`
              : "Pickup"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-text-muted">Order ID</dt>
          <dd className="break-all font-mono text-xs text-cocoa">{order.id}</dd>
        </div>
      </dl>

      <h2 className="mb-3 font-display text-lg text-cocoa">Items</h2>
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

      <div className="mb-10 flex justify-between font-medium text-cocoa">
        <span>Total</span>
        <span>{formatPrice(order.totalAmount)}</span>
      </div>

      <section className="border-t border-border-warm pt-8">
        <h2 className="mb-4 font-display text-lg text-cocoa">Manage status</h2>
        <UpdateOrderStatusForm
          orderId={order.id}
          currentStatus={order.status}
        />
        {order.status !== "cancelled" && order.status !== "completed" && (
          <p className="mt-3 text-xs text-text-muted">
            Cancelling restores product stock. Payment status is updated by
            PayHere, not here.
          </p>
        )}
      </section>
    </div>
  );
}
