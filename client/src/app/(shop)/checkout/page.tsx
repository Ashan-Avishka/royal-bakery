import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-cocoa">Checkout</h1>

      <div className="mb-8 rounded-2xl border border-border-warm bg-cream-alt p-6">
        <h2 className="mb-4 font-display text-xl text-cocoa">
          Order summary
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-cocoa">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span>
                {item.name} &times; {item.quantity}
              </span>
              <span>{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border-warm pt-4 font-medium text-cocoa">
          <span>Subtotal</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        <Link
          href="/cart"
          className="mt-4 inline-block text-sm text-caramel hover:text-caramel-hover"
        >
          Edit cart
        </Link>
      </div>

      <CheckoutForm />
    </div>
  );
}
