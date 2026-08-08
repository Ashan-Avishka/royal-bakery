import Link from "next/link";
import { redirect } from "next/navigation";
import { CartItemRow } from "@/components/CartItemRow";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  return (
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-honey/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="Your order"
          title="Your cart"
          description="Review your picks before checkout — everything is baked to order timing."
          action={{ href: "/products", label: "Continue shopping" }}
        />

        {error && (
          <p className="mb-6 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {cart.items.length === 0 ? (
          <div className="rounded-[1.5rem] border border-border-warm/80 bg-cream-alt px-6 py-14 text-center shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)]">
            <p className="font-display text-xl text-cocoa">Your cart is empty</p>
            <p className="mt-2 text-sm text-text-muted">
              Browse the menu and add something warm from the oven.
            </p>
            <Link href="/products" className="mt-6 inline-block">
              <Button className="px-7 py-3 text-[13px] tracking-[0.06em]">
                Browse the menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border-warm/80 bg-cream-alt p-5 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] sm:p-7">
            {cart.items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-warm pt-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Subtotal
                </p>
                <p className="mt-1 font-display text-2xl font-medium text-cocoa">
                  {formatPrice(cart.subtotal)}
                </p>
              </div>
              <Link href="/checkout">
                <Button className="px-7 py-3 text-[13px] tracking-[0.06em]">
                  Proceed to checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
