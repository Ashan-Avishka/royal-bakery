"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Order } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export interface PlaceOrderState {
  error: string | null;
}

export async function placeOrder(
  _prevState: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();

  let order: Order;
  try {
    const body: Record<string, string> = {};
    if (deliveryAddress) body.deliveryAddress = deliveryAddress;
    const result = await api<{ order: Order }>("/api/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    order = result.order;
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Failed to place order.",
    };
  }

  redirect(`/orders/${order.id}`);
}
