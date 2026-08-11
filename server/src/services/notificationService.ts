import { env } from "../config/env.js";
import { sendMail } from "../lib/mailer.js";
import {
  buildAdminLowStockEmail,
  buildAdminNewOrderEmail,
  buildOrderConfirmationEmail,
  buildOrderStatusChangeEmail,
  buildPaymentStatusChangeEmail,
  type OrderEmailData,
} from "../emails/templates.js";
import type { OrderStatus, PaymentStatus } from "../types/order.js";

export async function sendOrderConfirmationEmail(
  order: OrderEmailData,
  customerEmail: string
): Promise<void> {
  const { subject, html, text } = buildOrderConfirmationEmail(order);
  await sendMail({ to: customerEmail, subject, html, text });
}

export async function sendOrderStatusChangeEmail(
  order: { id: string; totalAmount: number },
  customerEmail: string,
  previousStatus: OrderStatus,
  newStatus: OrderStatus
): Promise<void> {
  const { subject, html, text } = buildOrderStatusChangeEmail(order, previousStatus, newStatus);
  await sendMail({ to: customerEmail, subject, html, text });
}

export async function sendPaymentStatusChangeEmail(
  order: { id: string; totalAmount: number },
  customerEmail: string,
  previousPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus
): Promise<void> {
  const { subject, html, text } = buildPaymentStatusChangeEmail(
    order,
    previousPaymentStatus,
    newPaymentStatus
  );
  await sendMail({ to: customerEmail, subject, html, text });
}

export async function sendAdminNewOrderEmail(
  order: OrderEmailData,
  customerEmail: string
): Promise<void> {
  if (!env.ADMIN_NOTIFICATION_EMAIL) {
    console.warn("ADMIN_NOTIFICATION_EMAIL is not set; skipping new-order admin email");
    return;
  }
  const { subject, html, text } = buildAdminNewOrderEmail(order, customerEmail);
  await sendMail({ to: env.ADMIN_NOTIFICATION_EMAIL, subject, html, text });
}

export async function sendAdminLowStockEmail(
  products: { name: string; stockQuantity: number }[]
): Promise<void> {
  if (products.length === 0) return;
  if (!env.ADMIN_NOTIFICATION_EMAIL) {
    console.warn("ADMIN_NOTIFICATION_EMAIL is not set; skipping low-stock admin email");
    return;
  }
  const { subject, html, text } = buildAdminLowStockEmail(products);
  await sendMail({ to: env.ADMIN_NOTIFICATION_EMAIL, subject, html, text });
}
