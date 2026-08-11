import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import { LOW_STOCK_THRESHOLD } from "./analyticsService.js";
import {
  sendAdminLowStockEmail,
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusChangeEmail,
} from "./notificationService.js";
import type { Order, OrderItem, OrderStatus, OrderSummary, PaymentStatus } from "../types/order.js";

interface OrderRow {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

function mapOrderSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    totalAmount: Number(row.total_amount),
    deliveryAddress: row.delivery_address,
    createdAt: row.created_at,
  };
}

async function loadOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data: itemRows, error } = await getSupabaseAdmin()
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw new AppError(500, "Failed to load order items", { cause: error });

  const rows = itemRows as OrderItemRow[];
  const productIds = rows.map((r) => r.product_id);

  const productNames = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products, error: prodError } = await getSupabaseAdmin()
      .from("products")
      .select("*")
      .in("id", productIds);
    if (prodError) throw new AppError(500, "Failed to load order products", { cause: prodError });
    for (const p of products as { id: string; name: string }[]) {
      productNames.set(p.id, p.name);
    }
  }

  return rows.map((row) => ({
    productId: row.product_id,
    name: productNames.get(row.product_id) ?? "Unknown product",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  }));
}

export async function createOrderFromCart(
  userId: string,
  deliveryAddress?: string
): Promise<Order> {
  const { data: orderId, error } = await getSupabaseAdmin().rpc("create_order_from_cart", {
    p_user_id: userId,
    p_delivery_address: deliveryAddress ?? null,
  });

  if (error) {
    if (error.code === "P0001") throw new AppError(400, "Cart is empty");
    if (error.code === "P0002") throw new AppError(409, error.message);
    throw new AppError(500, "Failed to create order", { cause: error });
  }

  const order = await getOrderById(orderId as string);
  if (!order) throw new AppError(500, "Order was created but could not be loaded");

  await notifyOrderCreated(userId, order);

  return order;
}

async function notifyOrderCreated(userId: string, order: Order): Promise<void> {
  try {
    const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const customerEmail = userData?.user?.email;
    if (!customerEmail) {
      console.warn(`No email found for user ${userId}; skipping order notification emails`);
      return;
    }

    void sendOrderConfirmationEmail(order, customerEmail);
    void sendAdminNewOrderEmail(order, customerEmail);
    await checkLowStockAndNotify(order.items);
  } catch (err) {
    console.error("Failed to send order-created notifications", err);
  }
}

async function checkLowStockAndNotify(items: OrderItem[]): Promise<void> {
  if (items.length === 0) return;
  const productIds = items.map((i) => i.productId);
  const { data: products, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .in("id", productIds);
  if (error || !products) return;

  const stockByProductId = new Map(
    (products as { id: string; stock_quantity: number }[]).map((p) => [p.id, p.stock_quantity])
  );
  const crossed: { name: string; stockQuantity: number }[] = [];
  for (const item of items) {
    const stockAfter = stockByProductId.get(item.productId);
    if (stockAfter === undefined) continue;
    const stockBefore = stockAfter + item.quantity;
    if (stockBefore > LOW_STOCK_THRESHOLD && stockAfter <= LOW_STOCK_THRESHOLD) {
      crossed.push({ name: item.name, stockQuantity: stockAfter });
    }
  }
  if (crossed.length > 0) {
    void sendAdminLowStockEmail(crossed);
  }
}

export async function listOrdersForUser(userId: string): Promise<OrderSummary[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list orders", { cause: error });
  return (data as OrderRow[]).map(mapOrderSummary);
}

export async function getOrderForUser(userId: string, orderId: string): Promise<Order | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load order", { cause: error });
  if (!data) return null;
  const items = await loadOrderItems(orderId);
  return { ...mapOrderSummary(data as OrderRow), items };
}

export async function listAllOrders(filters: { status?: string } = {}): Promise<OrderSummary[]> {
  let query = getSupabaseAdmin().from("orders").select("*");
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list orders", { cause: error });
  return (data as OrderRow[]).map(mapOrderSummary);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load order", { cause: error });
  if (!data) return null;
  const items = await loadOrderItems(orderId);
  return { ...mapOrderSummary(data as OrderRow), items };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const existing = await getOrderById(orderId);
  if (!existing) throw new AppError(404, "Order not found");

  if (status === "cancelled") {
    const { error } = await getSupabaseAdmin().rpc("cancel_order", { p_order_id: orderId });
    if (error) {
      if (error.code === "P0003") throw new AppError(409, "Order cannot be cancelled");
      throw new AppError(500, "Failed to cancel order", { cause: error });
    }
  } else {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) throw new AppError(500, "Failed to update order status", { cause: error });
  }

  const order = await getOrderById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  if (existing.status !== order.status) {
    await notifyOrderStatusChanged(orderId, order, existing.status);
  }

  return order;
}

async function notifyOrderStatusChanged(
  orderId: string,
  order: Order,
  previousStatus: OrderStatus
): Promise<void> {
  try {
    const { data: row, error } = await getSupabaseAdmin()
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !row) return;
    const userId = (row as { user_id: string }).user_id;

    const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const customerEmail = userData?.user?.email;
    if (!customerEmail) {
      console.warn(`No email found for user ${userId}; skipping order-status notification`);
      return;
    }

    void sendOrderStatusChangeEmail(order, customerEmail, previousStatus, order.status);
  } catch (err) {
    console.error("Failed to send order-status-change notification", err);
  }
}
