import { api, ApiError } from "@/lib/api";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  deliveryAddress: string | null;
  createdAt: string;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
}

export async function listOrders(accessToken: string): Promise<OrderSummary[]> {
  const { orders } = await api<{ orders: OrderSummary[] }>("/api/orders", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return orders;
}

export async function getOrder(accessToken: string, id: string): Promise<Order | null> {
  try {
    const { order } = await api<{ order: Order }>(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return order;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
}
