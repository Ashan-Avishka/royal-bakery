import Link from "next/link";
import { redirect } from "next/navigation";
import { CartItemRow } from "@/components/CartItemRow";
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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-cocoa">Your cart</h1>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {cart.items.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-cream-alt p-10 text-center">
          <p className="mb-4 text-text-muted">Your cart is empty.</p>
          <Link href="/products">
            <Button>Browse the menu</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-warm bg-cream-alt p-6">
          {cart.items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-warm pt-6">
            <p className="text-lg font-medium text-cocoa">
              Subtotal: {formatPrice(cart.subtotal)}
            </p>
            <Link href="/checkout">
              <Button className="px-6 py-3">Proceed to checkout</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
