import { api, ApiError } from "@/lib/api";
import type { Order, OrderStatus, OrderSummary } from "@/lib/orders";

export async function listAdminOrders(
  accessToken: string,
  filters: { status?: OrderStatus } = {}
): Promise<OrderSummary[]> {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  const qs = query.toString();

  const { orders } = await api<{ orders: OrderSummary[] }>(
    `/api/admin/orders${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return orders;
}

export async function getAdminOrder(
  accessToken: string,
  id: string
): Promise<Order | null> {
  try {
    const { order } = await api<{ order: Order }>(`/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return order;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function updateAdminOrderStatus(
  accessToken: string,
  id: string,
  status: OrderStatus
): Promise<Order> {
  const { order } = await api<{ order: Order }>(
    `/api/admin/orders/${id}/status`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status }),
    }
  );
  return order;
}
