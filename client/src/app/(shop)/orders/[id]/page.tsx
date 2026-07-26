import { notFound, redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-cocoa">Order details</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-border-warm bg-cream-alt p-6">
        <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-text-muted">Placed on</dt>
            <dd className="font-medium text-cocoa">
              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
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
        </dl>

        <h2 className="mb-3 font-display text-lg text-cocoa">Items</h2>
        <ul className="flex flex-col gap-2 text-sm text-cocoa">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span>
                {item.name} &times; {item.quantity}
              </span>
              <span>{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-border-warm pt-4 font-medium text-cocoa">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
