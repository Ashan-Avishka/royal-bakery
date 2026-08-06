import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { getCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartItemCount = 0;
  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      try {
        const cart = await getCart(session.access_token);
        cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      } catch {
        // Non-fatal — header still renders without a cart count.
      }
    }
  }

  return (
    <StorefrontHeader
      signedIn={Boolean(user)}
      isAdmin={user?.app_metadata?.role === "admin"}
      cartItemCount={cartItemCount}
    />
  );
}
