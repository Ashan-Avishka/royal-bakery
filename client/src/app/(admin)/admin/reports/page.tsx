import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { getAdminAnalytics } from "@/lib/admin/analytics";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 29);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultDateRange();
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)
    ? params.from
    : defaults.from;
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to)
    ? params.to
    : defaults.to;

  const session = await requireAdminSession();
  const analytics = await getAdminAnalytics(session.accessToken, { from, to });

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <h1 className="mb-2 font-display text-3xl text-cocoa">Reports</h1>
      <p className="mb-6 text-sm text-text-muted">
        Sales figures include paid orders only. Order history lists all orders
        in the selected range.
      </p>

      <form
        method="get"
        className="mb-10 flex min-w-0 flex-col gap-3 border-b border-border-warm pb-6 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex w-full flex-col gap-1.5 sm:w-auto">
          <label htmlFor="from" className="text-sm font-medium text-cocoa">
            From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={from}
            className="min-h-11 w-full rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-base text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel sm:text-sm"
          />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-auto">
          <label htmlFor="to" className="text-sm font-medium text-cocoa">
            To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={to}
            className="min-h-11 w-full rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-base text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 w-full rounded-full bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt hover:bg-caramel-hover sm:w-auto"
        >
          Apply
        </button>
      </form>

      <div className="mb-10 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-4">
        <div className="border-b border-border-warm pb-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Revenue
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
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Avg order
          </p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {formatPrice(analytics.averageOrderValue)}
          </p>
        </div>
        <div className="border-b border-border-warm pb-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Top category
          </p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {analytics.topCategory ?? "—"}
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-cocoa">
          Popular products
        </h2>
        {analytics.topProducts.length === 0 ? (
          <p className="text-sm text-text-muted">
            No paid product sales in this range.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
            {analytics.topProducts.map((product, index) => (
              <li
                key={product.productId}
                className="flex min-w-0 flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-cocoa">
                  <span className="mr-2 text-text-muted">{index + 1}.</span>
                  {product.name}
                </span>
                <span className="shrink-0 text-text-muted">
                  {product.quantitySold} sold · {formatPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-cocoa">
          Sales by category
        </h2>
        {analytics.categorySales.length === 0 ? (
          <p className="text-sm text-text-muted">No category sales yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
            {analytics.categorySales.map((row) => (
              <li
                key={row.category}
                className="flex min-w-0 flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="break-words font-medium text-cocoa">{row.category}</span>
                <span className="text-text-muted">
                  {row.count} items · {formatPrice(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-cocoa">Order history</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-caramel hover:text-caramel-hover"
          >
            Manage orders
          </Link>
        </div>
        {analytics.orders.length === 0 ? (
          <p className="text-sm text-text-muted">No orders in this range.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
            {analytics.orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex min-w-0 flex-col gap-3 py-4 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between"
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
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
