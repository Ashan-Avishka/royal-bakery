import Link from "next/link";
import { redirect } from "next/navigation";
import { CartItemRow } from "@/components/CartItemRow";
import { PageHeader } from "@/components/PageHeader";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ error?: string; errorProductId?: string }> }) {
  const { error, errorProductId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const cart = await getCart(session!.access_token);
  const hasRowError = Boolean(error && errorProductId && cart.items.some((item) => item.productId === errorProductId));

  return (
    <section className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-honey/25 blur-3xl" aria-hidden />
      <div className="page-container page-section relative min-w-0 max-w-3xl">
        <PageHeader eyebrow="Your order" title="Your cart" description="Review your picks before checkout." action={{ href: "/products", label: "Continue shopping" }} />
        {error && !hasRowError && <p role="alert" className="mb-6 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {cart.items.length === 0 ? (
          <div className="surface-pad rounded-[1.5rem] border border-border-warm/80 bg-cream-alt py-14 text-center shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)]">
            <h2 className="font-display text-xl text-cocoa">Your cart is empty</h2>
            <p className="mt-2 text-sm text-text-muted">Browse the menu and add something to your cart.</p>
            <Link href="/products" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-cocoa px-7 py-3 text-[13px] font-medium tracking-[0.06em] text-cream-alt transition-colors hover:bg-cocoa-dark">Browse the menu</Link>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
            <div className="surface-pad min-w-0 flex-1 rounded-[1.5rem] border border-border-warm/80 bg-cream-alt shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)]">
              <h2 className="mb-3 font-display text-xl text-cocoa">Cart items</h2>
              {cart.items.map((item) => <CartItemRow key={item.productId} item={item} error={errorProductId === item.productId ? error : undefined} />)}
            </div>
            <aside className="surface-pad w-full min-w-0 rounded-[1.5rem] border border-border-warm/80 bg-cream-alt shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] lg:w-80 lg:shrink-0">
              <h2 className="font-display text-xl text-cocoa">Order summary</h2>
              <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-text-muted">Subtotal</p>
              <p className="mt-1 font-display text-2xl font-medium text-cocoa">{formatPrice(cart.subtotal)}</p>
              <Link href="/checkout" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cocoa px-5 py-2.5 text-sm font-medium tracking-wide text-cream-alt transition-colors hover:bg-cocoa-dark">Proceed to checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
