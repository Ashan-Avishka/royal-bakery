"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { updateAdminOrderStatus } from "@/lib/admin/orders";
import { requireAdminSession } from "@/lib/admin/session";
import type { OrderStatus } from "@/lib/orders";

const ALLOWED_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];

export interface UpdateOrderStatusState {
  error: string | null;
  success: boolean;
}

export async function updateOrderStatus(
  orderId: string,
  _prevState: UpdateOrderStatusState,
  formData: FormData
): Promise<UpdateOrderStatusState> {
  const session = await requireAdminSession();
  const status = String(formData.get("status") ?? "") as OrderStatus;

  if (!ALLOWED_STATUSES.includes(status)) {
    return { error: "Invalid order status.", success: false };
  }

  try {
    await updateAdminOrderStatus(session.accessToken, orderId, status);
  } catch (err) {
    return {
      error:
        err instanceof ApiError ? err.message : "Failed to update order status.",
      success: false,
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { error: null, success: true };
}
