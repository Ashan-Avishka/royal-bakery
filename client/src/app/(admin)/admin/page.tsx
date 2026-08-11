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
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-cocoa">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Sales KPIs use paid orders only.{" "}
            <Link
              href="/admin/reports"
              className="inline-flex min-h-11 items-center font-medium text-caramel-hover hover:text-cocoa"
            >
              Full reports
            </Link>
          </p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-4">
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
          className="block min-h-11 border-b border-border-warm pb-3 transition-colors hover:border-caramel"
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Low stock
          </p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {analytics.lowStockCount}
          </p>
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-4">
        {STATUS_COUNTS.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className="block min-h-11 border-b border-border-warm pb-3 transition-colors hover:border-caramel"
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
                className="flex min-w-0 flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="break-words font-medium text-cocoa">{product.name}</span>
                <span className="break-words text-text-muted">
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
          className="inline-flex min-h-11 items-center text-sm font-medium text-caramel-hover hover:text-cocoa"
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
                className="flex min-w-0 flex-col gap-3 px-4 py-4 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
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
                <div className="flex flex-wrap"><OrderStatusBadge status={order.status} /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
