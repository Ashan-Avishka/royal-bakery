import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderDetailPanel } from "@/components/OrderDetailPanel";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import { formatPrice } from "@/lib/catalog";
import { getOrder, listOrders } from "@/lib/orders";
import { buildQuery } from "@/lib/queryString";
import { createClient } from "@/lib/supabase/server";

const PANEL_CLASSNAME =
  "rounded-[1.5rem] border border-border-warm/80 bg-cream-alt p-6 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] sm:p-8";
const PLACEHOLDER_CLASSNAME =
  "hidden rounded-[1.5rem] border border-dashed border-border-warm/80 bg-cream-alt/50 p-6 text-center text-sm text-text-muted lg:block";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string | string[] }>;
}) {
  const { selected: rawSelected } = await searchParams;
  const selected = Array.isArray(rawSelected) ? rawSelected[0] : rawSelected;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const orders = await listOrders(session!.access_token);
  const selectedOrder = selected
    ? await getOrder(session!.access_token, selected)
    : null;

  return (
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-honey/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="Order history"
          title="Your orders"
          description="Track past and current orders from the bakery."
          action={{ href: "/products", label: "Browse the menu" }}
        />

        {orders.length === 0 ? (
          <div className="rounded-[1.5rem] border border-border-warm/80 bg-cream-alt px-6 py-14 text-center shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)]">
            <p className="font-display text-xl text-cocoa">No orders yet</p>
            <p className="mt-2 text-sm text-text-muted">
              When you place an order, it will show up here.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-caramel transition-colors hover:text-caramel-hover"
            >
              Browse the menu →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
              <div className="flex flex-col gap-4">
                {orders.map((order) => {
                  const isActive = order.id === selected;
                  const rowHref = `/orders${buildQuery({ selected: order.id })}`;
                  return (
                    <Link
                      key={order.id}
                      href={rowHref}
                      className={`flex items-center justify-between rounded-[1.35rem] border border-border-warm/80 bg-cream-alt p-5 shadow-[0_12px_32px_-24px_rgba(58,26,19,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(58,26,19,0.35)] sm:p-6 ${
                        isActive
                          ? "-translate-y-0.5 shadow-[0_20px_40px_-24px_rgba(58,26,19,0.35)]"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-display text-lg font-medium text-cocoa">
                          Order placed{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">
                          {order.deliveryAddress ? "Delivery" : "Pickup"} &middot;{" "}
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className={`w-full shrink-0 lg:w-96 ${selected ? "" : "hidden lg:block"}`}>
              {selected ? (
                <DetailPanel
                  title="Order details"
                  closeHref="/orders"
                  className={PANEL_CLASSNAME}
                >
                  {selectedOrder ? (
                    <OrderDetailPanel order={selectedOrder} />
                  ) : (
                    <p className="text-sm text-text-muted">
                      This order could not be found.
                    </p>
                  )}
                </DetailPanel>
              ) : (
                <DetailPanelPlaceholder
                  message="Select an order to see its details."
                  className={PLACEHOLDER_CLASSNAME}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
