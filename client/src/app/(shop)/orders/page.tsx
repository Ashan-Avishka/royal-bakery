import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatPrice } from "@/lib/catalog";
import { listOrders } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-cocoa">Your orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-cream-alt p-10 text-center">
          <p className="mb-4 text-text-muted">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/products"
            className="font-medium text-caramel hover:text-caramel-hover"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border border-border-warm bg-cream-alt p-5 transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-medium text-cocoa">
                  Order placed{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm text-text-muted">
                  {order.deliveryAddress ? "Delivery" : "Pickup"} &middot;{" "}
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
