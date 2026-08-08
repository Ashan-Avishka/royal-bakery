"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PaymentInitiation } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

export interface InitiatePaymentState {
  payment: PaymentInitiation | null;
  error: string | null;
}

export async function initiatePaymentAction(
  _prevState: InitiatePaymentState,
  formData: FormData
): Promise<InitiatePaymentState> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const orderId = String(formData.get("orderId") ?? "");

  try {
    const { payment } = await api<{ payment: PaymentInitiation }>(
      "/api/payments/initiate",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId }),
      }
    );
    return { payment, error: null };
  } catch (err) {
    return {
      payment: null,
      error: err instanceof ApiError ? err.message : "Failed to start payment.",
    };
  }
}
