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
