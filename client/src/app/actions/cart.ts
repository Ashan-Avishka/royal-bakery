"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

async function requireSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function addToCart(formData: FormData) {
  const session = await requireSession();
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  try {
    await api("/api/cart", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ productId, quantity }),
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to add to cart.";
    redirect(`/products/${productId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/cart");
  revalidatePath(`/products/${productId}`);
  redirect("/cart");
}

export async function updateCartItemQuantity(formData: FormData) {
  const session = await requireSession();
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  try {
    await api(`/api/cart/${productId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ quantity }),
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to update quantity.";
    const query = new URLSearchParams({ error: message, errorProductId: productId });
    redirect(`/cart?${query.toString()}`);
  }

  revalidatePath("/cart");
  // revalidatePath only invalidates the data cache for *future* requests to
  // /cart -- it does not by itself force the page we're already sitting on
  // to re-render with the new data. refresh() is the primitive for that:
  // it refreshes the client router's view of the current route.
  refresh();
}

export async function removeCartItem(formData: FormData) {
  const session = await requireSession();
  const productId = String(formData.get("productId") ?? "");

  try {
    await api(`/api/cart/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to remove item.";
    const query = new URLSearchParams({ error: message, errorProductId: productId });
    redirect(`/cart?${query.toString()}`);
  }

  revalidatePath("/cart");
  refresh();
}
