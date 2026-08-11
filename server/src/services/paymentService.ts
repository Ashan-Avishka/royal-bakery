import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../errors.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendPaymentStatusChangeEmail } from "./notificationService.js";
import type { PaymentInitiation, WebhookPayload } from "../types/payment.js";
import type { PaymentStatus } from "../types/order.js";
import { getOrderForUser } from "./orderService.js";
import { getProfileById } from "./profileService.js";

function md5Upper(input: string): string {
  return crypto.createHash("md5").update(input, "utf8").digest("hex").toUpperCase();
}

function payhereHash(parts: string[]): string {
  return md5Upper(parts.join("") + md5Upper(env.PAYHERE_MERCHANT_SECRET));
}

const CHECKOUT_URLS = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout",
} as const;

export async function initiatePayment(params: {
  userId: string;
  email: string;
  orderId: string;
}): Promise<PaymentInitiation> {
  const order = await getOrderForUser(params.userId, params.orderId);
  if (!order) throw new AppError(404, "Order not found");
  if (order.status === "cancelled") throw new AppError(400, "This order has been cancelled");
  if (order.paymentStatus === "paid") throw new AppError(400, "This order has already been paid");

  const profile = await getProfileById(params.userId);
  if (!profile?.fullName || !profile.phone || !profile.address) {
    throw new AppError(400, "Complete your profile (name, phone, address) before paying");
  }

  const admin = getSupabaseAdmin();
  const { data: existing, error: existingError } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", params.orderId)
    .eq("status", "pending")
    .maybeSingle();
  if (existingError) {
    throw new AppError(500, "Failed to check existing payment", { cause: existingError });
  }

  if (!existing) {
    const { error: insertError } = await admin.from("payments").insert({
      order_id: params.orderId,
      payment_method: "payhere",
      status: "pending",
      amount: order.totalAmount,
    });
    if (insertError) {
      throw new AppError(500, "Failed to create payment record", { cause: insertError });
    }
  }

  const amount = order.totalAmount.toFixed(2);
  const currency = "LKR";
  const hash = payhereHash([env.PAYHERE_MERCHANT_ID, params.orderId, amount, currency]);

  const [firstName, ...rest] = profile.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  return {
    checkoutUrl: CHECKOUT_URLS[env.PAYHERE_MODE],
    merchantId: env.PAYHERE_MERCHANT_ID,
    returnUrl: `${env.CLIENT_ORIGIN}/orders/${params.orderId}?payment=success`,
    cancelUrl: `${env.CLIENT_ORIGIN}/orders/${params.orderId}?payment=cancelled`,
    notifyUrl: `${env.API_PUBLIC_URL}/api/payments/webhook`,
    orderId: params.orderId,
    items: `Royal Bakery order ${params.orderId.slice(0, 8)}`,
    currency,
    amount,
    hash,
    firstName,
    lastName,
    email: params.email,
    phone: profile.phone,
    address: profile.address,
    city: "Colombo",
    country: "Sri Lanka",
  };
}

export async function processPaymentNotification(payload: WebhookPayload): Promise<void> {
  const expected = payhereHash([
    payload.merchant_id,
    payload.order_id,
    payload.payhere_amount,
    payload.payhere_currency,
    payload.status_code,
  ]);
  if (expected !== payload.md5sig) {
    throw new AppError(400, "Invalid payment notification signature");
  }

  const statusCode = Number(payload.status_code);
  const paymentStatus =
    statusCode === 2 ? "completed" : statusCode === -2 || statusCode === -3 ? "failed" : "pending";
  const orderPaymentStatus: PaymentStatus =
    statusCode === 2 ? "paid" : statusCode === -2 || statusCode === -3 ? "failed" : "unpaid";

  const admin = getSupabaseAdmin();

  const { data: existingOrderRowData, error: existingOrderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", payload.order_id)
    .maybeSingle();
  if (existingOrderError) {
    console.error(
      "Failed to load order for payment notification; skipping status-change email",
      existingOrderError
    );
  }
  const existingOrderRow = existingOrderError ? null : existingOrderRowData;
  const previousPaymentStatus = (existingOrderRow as { payment_status: PaymentStatus } | null)
    ?.payment_status;

  const { error: paymentError } = await admin
    .from("payments")
    .update({
      status: paymentStatus,
      transaction_id: payload.payment_id,
      payhere_payment_id: payload.payment_id,
      paid_at: statusCode === 2 ? new Date().toISOString() : null,
    })
    .eq("order_id", payload.order_id);
  if (paymentError) {
    throw new AppError(500, "Failed to update payment record", { cause: paymentError });
  }

  const { error: orderError } = await admin
    .from("orders")
    .update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() })
    .eq("id", payload.order_id);
  if (orderError) {
    throw new AppError(500, "Failed to update order payment status", { cause: orderError });
  }

  if (existingOrderRow && previousPaymentStatus !== orderPaymentStatus) {
    await notifyPaymentStatusChanged(
      existingOrderRow as { id: string; user_id: string; total_amount: string },
      previousPaymentStatus as PaymentStatus,
      orderPaymentStatus
    );
  }
}

async function notifyPaymentStatusChanged(
  orderRow: { id: string; user_id: string; total_amount: string },
  previousPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus
): Promise<void> {
  try {
    const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(orderRow.user_id);
    const customerEmail = userData?.user?.email;
    if (!customerEmail) {
      console.warn(`No email found for user ${orderRow.user_id}; skipping payment-status notification`);
      return;
    }
    void sendPaymentStatusChangeEmail(
      { id: orderRow.id, totalAmount: Number(orderRow.total_amount) },
      customerEmail,
      previousPaymentStatus,
      newPaymentStatus
    );
  } catch (err) {
    console.error("Failed to send payment-status-change notification", err);
  }
}
