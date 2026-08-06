import Link from "next/link";
import { redirect } from "next/navigation";
import { CartItemRow } from "@/components/CartItemRow";
import { EmptyState } from "@/components/storefront/EmptyState";
import { OrderSummary } from "@/components/storefront/OrderSummary";
import { getCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; errorProductId?: string }>;
}) {
  const { error, errorProductId } = await searchParams;
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
  const matchedErrorProductId =
    error && errorProductId &&
    cart.items.some((item) => item.productId === errorProductId)
      ? errorProductId
      : undefined;
  const pageError = error && !matchedErrorProductId ? error : undefined;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <h1 className="font-display text-3xl text-cocoa sm:text-4xl">Your cart</h1>
      <p className="mt-2 max-w-2xl text-text-muted">
        Review your bakery selection before checkout.
      </p>

      {pageError ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {pageError}
        </p>
      ) : null}

      {cart.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Choose a cake, pastry, or savoury favourite to begin your order."
            actionHref="/products"
            actionLabel="Browse the menu"
          />
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
          <section aria-labelledby="cart-items-heading" className="min-w-0">
            <h2 id="cart-items-heading" className="sr-only">
              Cart items
            </h2>
            {cart.items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                error={
                  matchedErrorProductId === item.productId ? error : undefined
                }
              />
            ))}
          </section>

          <aside className="lg:sticky lg:top-24">
            <OrderSummary
              items={cart.items}
              subtotal={cart.subtotal}
              action={
                <Link
                  href="/checkout"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cocoa px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-cocoa-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
                >
                  Proceed to checkout
                </Link>
              }
            />
          </aside>
        </div>
      )}
    </div>
  );
}
