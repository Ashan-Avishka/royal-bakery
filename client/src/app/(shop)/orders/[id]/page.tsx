import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { formatPrice } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const order = await getOrder(session!.access_token, id);

  if (!order) {
    notFound();
  }

  return (
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-honey/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="Order history"
          title="Order details"
          description={`Placed ${new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`}
          action={{ href: "/orders", label: "All orders" }}
        />

        <div className="mb-6 flex justify-end">
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="rounded-[1.5rem] border border-border-warm/80 bg-cream-alt p-6 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] sm:p-8">
          <dl className="mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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

          <h2 className="mb-3 font-display text-xl text-cocoa">Items</h2>
          <ul className="flex flex-col gap-3 text-sm text-cocoa">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex justify-between gap-4 border-b border-border-warm/60 pb-3 last:border-0 last:pb-0"
              >
                <span>
                  {item.name} &times; {item.quantity}
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
        </div>

        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-caramel transition-colors hover:text-caramel-hover"
        >
          Continue shopping →
        </Link>
      </div>
    </section>
  );
}
