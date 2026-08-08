import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageHeader } from "@/components/PageHeader";
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
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-honey/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="Almost there"
          title="Checkout"
          description="Confirm your details and place the order — we’ll bake it fresh."
          action={{ href: "/cart", label: "Edit cart" }}
        />

        <div className="mb-8 rounded-[1.5rem] border border-border-warm/80 bg-cream-alt p-6 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] sm:p-7">
          <h2 className="font-display text-xl font-medium text-cocoa">
            Order summary
          </h2>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-cocoa">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4">
                <span className="text-text-muted">
                  {item.name}{" "}
                  <span className="text-cocoa/70">&times; {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatPrice(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-border-warm pt-5 font-display text-lg font-medium text-cocoa">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border-warm/80 bg-cream-alt p-6 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] sm:p-7">
          <CheckoutForm />
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          Need to change something?{" "}
          <Link
            href="/cart"
            className="font-medium text-caramel transition-colors hover:text-caramel-hover"
          >
            Return to cart
          </Link>
        </p>
      </div>
    </section>
  );
}
