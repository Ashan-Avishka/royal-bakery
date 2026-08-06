import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { OrderSummary } from "@/components/storefront/OrderSummary";
import { getCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage() {
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
  const cart = await getCart(session!.access_token);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <h1 className="font-display text-3xl text-cocoa sm:text-4xl">Checkout</h1>
      <p className="mt-2 max-w-2xl text-text-muted">
        Confirm how you would like to receive your order, then place it when you are ready.
      </p>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <section className="min-w-0">
          <CheckoutForm />
          <Link
            href="/cart"
            className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-cocoa underline-offset-4 hover:text-cocoa-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
          >
            Return to cart
          </Link>
        </section>

        <aside className="lg:sticky lg:top-24">
          <OrderSummary
            items={cart.items}
            subtotal={cart.subtotal}
            editHref="/cart"
          />
        </aside>
      </div>
    </div>
  );
}
