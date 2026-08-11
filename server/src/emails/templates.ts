import type { OrderStatus, PaymentStatus } from "../types/order.js";

const BRAND_NAME = "Royal Bakery";
const BRAND_ADDRESS = "Dorenegama Rd, Medawala, Harispaththuwa";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderEmailData {
  id: string;
  items: OrderEmailItem[];
  totalAmount: number;
  deliveryAddress: string | null;
}

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-US")}`;
}

function orderShortId(orderId: string): string {
  return orderId.slice(0, 8);
}

function renderShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background-color:#FBF6EE;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background-color:#3A1A13;color:#FBF6EE;padding:20px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#D9A441;">${BRAND_NAME}</p>
        <h1 style="margin:8px 0 0;font-size:20px;">${title}</h1>
      </div>
      <div style="padding:24px;color:#3A1A13;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #EADFCB;color:#8A7A68;font-size:12px;">
        ${BRAND_NAME} &middot; ${BRAND_ADDRESS}
      </div>
    </div>
  </body>
</html>`;
}

function renderTextShell(title: string, bodyText: string): string {
  return `${BRAND_NAME}\n${title}\n\n${bodyText}\n\n---\n${BRAND_NAME} - ${BRAND_ADDRESS}`;
}

function renderItemsHtml(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;">${item.quantity} &times; ${item.name}</td><td style="padding:4px 0;text-align:right;">${formatLKR(item.subtotal)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>`;
}

function renderItemsText(items: OrderEmailItem[]): string {
  return items.map((item) => `  ${item.quantity} x ${item.name} - ${formatLKR(item.subtotal)}`).join("\n");
}

export function buildOrderConfirmationEmail(order: OrderEmailData): EmailContent {
  const title = "Order confirmed";
  const bodyHtml = `
    <p>Thanks for your order! We've received order <strong>#${orderShortId(order.id)}</strong> and we're getting it ready.</p>
    ${renderItemsHtml(order.items)}
    <p><strong>Total: ${formatLKR(order.totalAmount)}</strong></p>
    ${order.deliveryAddress ? `<p>Delivering to: ${order.deliveryAddress}</p>` : ""}
  `;
  const bodyText = `Thanks for your order! We've received order #${orderShortId(order.id)} and we're getting it ready.\n\n${renderItemsText(order.items)}\n\nTotal: ${formatLKR(order.totalAmount)}${order.deliveryAddress ? `\nDelivering to: ${order.deliveryAddress}` : ""}`;

  return {
    subject: `Order confirmed - #${orderShortId(order.id)}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function buildOrderStatusChangeEmail(
  order: { id: string; totalAmount: number },
  previousStatus: OrderStatus,
  newStatus: OrderStatus
): EmailContent {
  const title = "Order status updated";
  const bodyHtml = `
    <p>Order <strong>#${orderShortId(order.id)}</strong> is now <strong>${STATUS_LABELS[newStatus]}</strong> (previously ${STATUS_LABELS[previousStatus]}).</p>
    <p>Order total: ${formatLKR(order.totalAmount)}</p>
  `;
  const bodyText = `Order #${orderShortId(order.id)} is now ${STATUS_LABELS[newStatus]} (previously ${STATUS_LABELS[previousStatus]}).\n\nOrder total: ${formatLKR(order.totalAmount)}`;

  return {
    subject: `Order #${orderShortId(order.id)} is now ${STATUS_LABELS[newStatus]}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export function buildPaymentStatusChangeEmail(
  order: { id: string; totalAmount: number },
  previousPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus
): EmailContent {
  const title = "Payment status updated";
  const bodyHtml = `
    <p>Payment for order <strong>#${orderShortId(order.id)}</strong> is now <strong>${PAYMENT_STATUS_LABELS[newPaymentStatus]}</strong> (previously ${PAYMENT_STATUS_LABELS[previousPaymentStatus]}).</p>
    <p>Order total: ${formatLKR(order.totalAmount)}</p>
  `;
  const bodyText = `Payment for order #${orderShortId(order.id)} is now ${PAYMENT_STATUS_LABELS[newPaymentStatus]} (previously ${PAYMENT_STATUS_LABELS[previousPaymentStatus]}).\n\nOrder total: ${formatLKR(order.totalAmount)}`;

  return {
    subject: `Payment ${PAYMENT_STATUS_LABELS[newPaymentStatus].toLowerCase()} for order #${orderShortId(order.id)}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

export function buildAdminNewOrderEmail(order: OrderEmailData, customerEmail: string): EmailContent {
  const title = "New order received";
  const bodyHtml = `
    <p>New order <strong>#${orderShortId(order.id)}</strong> from ${customerEmail}.</p>
    ${renderItemsHtml(order.items)}
    <p><strong>Total: ${formatLKR(order.totalAmount)}</strong></p>
    ${order.deliveryAddress ? `<p>Delivery address: ${order.deliveryAddress}</p>` : ""}
  `;
  const bodyText = `New order #${orderShortId(order.id)} from ${customerEmail}.\n\n${renderItemsText(order.items)}\n\nTotal: ${formatLKR(order.totalAmount)}${order.deliveryAddress ? `\nDelivery address: ${order.deliveryAddress}` : ""}`;

  return {
    subject: `New order #${orderShortId(order.id)} - ${formatLKR(order.totalAmount)}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

export function buildAdminLowStockEmail(products: { name: string; stockQuantity: number }[]): EmailContent {
  const title = "Low stock alert";
  const rowsHtml = products.map((p) => `<li>${p.name} &mdash; ${p.stockQuantity} left</li>`).join("");
  const rowsText = products.map((p) => `  ${p.name} - ${p.stockQuantity} left`).join("\n");

  const bodyHtml = `
    <p>The following product${products.length > 1 ? "s have" : " has"} dropped to low stock:</p>
    <ul>${rowsHtml}</ul>
  `;
  const bodyText = `The following product${products.length > 1 ? "s have" : " has"} dropped to low stock:\n\n${rowsText}`;

  return {
    subject: `Low stock: ${products.map((p) => p.name).join(", ")}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}
