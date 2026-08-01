import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getAdminAnalytics } from "@/lib/admin/analytics";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/orders";

const STATUS_COUNTS: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const analytics = await getAdminAnalytics(session.accessToken);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-cocoa">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Sales KPIs use paid orders only.{" "}
            <Link
              href="/admin/reports"
              className="font-medium text-caramel hover:text-caramel-hover"
            >
              Full reports
            </Link>
          </p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="border-b border-border-warm pb-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Paid revenue
          </p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {formatPrice(analytics.totalRevenue)}
          </p>
        </div>
        <div className="border-b border-border-warm pb-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Paid orders
          </p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {analytics.paidOrdersCount}
          </p>
        </div>
        <div className="border-b border-border-warm pb-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">AOV</p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {formatPrice(analytics.averageOrderValue)}
          </p>
        </div>
        <Link
          href="/admin/products?lowStock=1"
          className="border-b border-border-warm pb-3 transition-colors hover:border-caramel"
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Low stock
          </p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {analytics.lowStockCount}
          </p>
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUS_COUNTS.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className="border-b border-border-warm pb-3 transition-colors hover:border-caramel"
          >
            <p className="text-xs uppercase tracking-wide text-text-muted">
              {status}
            </p>
            <p className="mt-1 font-display text-2xl text-cocoa">
              {analytics.ordersByStatus[status] ?? 0}
            </p>
          </Link>
        ))}
      </div>

      {analytics.topProducts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl text-cocoa">Top products</h2>
          <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
            {analytics.topProducts.slice(0, 5).map((product) => (
              <li
                key={product.productId}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="font-medium text-cocoa">{product.name}</span>
                <span className="text-text-muted">
                  {product.quantitySold} sold · {formatPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl text-cocoa">Recent orders</h2>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-caramel hover:text-caramel-hover"
        >
          View all
        </Link>
      </div>

      {analytics.orders.length === 0 ? (
        <p className="text-sm text-text-muted">No orders yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
          {analytics.orders.slice(0, 8).map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-honey-light/30"
              >
                <div>
                  <p className="font-medium text-cocoa">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-text-muted">
                    {order.deliveryAddress ? "Delivery" : "Pickup"} ·{" "}
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
