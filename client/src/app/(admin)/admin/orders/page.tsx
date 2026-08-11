import Link from "next/link";
import { OrderDetailPanel } from "@/components/admin/OrderDetailPanel";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import { getAdminOrder, listAdminOrders } from "@/lib/admin/orders";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/orders";
import { buildQuery } from "@/lib/queryString";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function isOrderStatus(value: string): value is OrderStatus {
  return ["pending", "processing", "completed", "cancelled"].includes(value);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    selected?: string | string[];
  }>;
}) {
  const { status: statusParam, selected: rawSelected } = await searchParams;
  const selected = Array.isArray(rawSelected) ? rawSelected[0] : rawSelected;
  const statusFilter =
    statusParam && isOrderStatus(statusParam) ? statusParam : undefined;

  const session = await requireAdminSession();
  const orders = await listAdminOrders(session.accessToken, {
    status: statusFilter,
  });
  const selectedOrder = selected
    ? await getAdminOrder(session.accessToken, selected)
    : null;

  const closeHref = `/admin/orders${buildQuery({ status: statusFilter })}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
      <h1 className="mb-6 font-display text-3xl text-cocoa">Orders</h1>

      <div className={`mb-8 flex flex-wrap gap-2 ${selected ? "hidden lg:flex" : ""}`}>
        {FILTERS.map((filter) => {
          const href =
            filter.value === "all"
              ? "/admin/orders"
              : `/admin/orders?status=${filter.value}`;
          const active =
            filter.value === "all"
              ? !statusFilter
              : statusFilter === filter.value;

          return (
            <Link
              key={filter.value}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-cream-alt bg-cocoa font-semibold text-cream-alt"
                  : "bg-honey-light/50 text-cocoa hover:bg-honey-light"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
          {orders.length === 0 ? (
            <p className="text-sm text-text-muted">
              No orders{statusFilter ? ` with status “${statusFilter}”` : ""}.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
              {orders.map((order) => {
                const isActive = order.id === selected;
                const rowHref = `/admin/orders${buildQuery({
                  status: statusFilter,
                  selected: order.id,
                })}`;
                return (
                  <li key={order.id}>
                    <Link
                      href={rowHref}
                      scroll={false}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-w-0 flex-col gap-3 px-4 py-5 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between ${
                        isActive ? "bg-honey-light/40" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-cocoa">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-text-muted">
                          {order.deliveryAddress ? "Delivery" : "Pickup"} ·{" "}
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="mt-1 font-mono text-xs text-text-muted">
                          {order.id.slice(0, 8)}…
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={`w-full shrink-0 lg:w-96 lg:self-stretch ${selected ? "" : "hidden lg:block"}`}>
          {selected ? (
            <DetailPanel title="Order details" closeHref={closeHref}>
              {selectedOrder ? (
                <OrderDetailPanel order={selectedOrder} />
              ) : (
                <p className="text-sm text-text-muted">
                  This order could not be found.
                </p>
              )}
            </DetailPanel>
          ) : (
            <DetailPanelPlaceholder message="Select an order to see its details." />
          )}
        </aside>
      </div>
    </div>
  );
}
