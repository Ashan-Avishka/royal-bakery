import { api } from "@/lib/api";
import type { OrderStatus, OrderSummary } from "@/lib/orders";

export interface TopProductStat {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface CategorySalesStat {
  category: string;
  count: number;
  revenue: number;
}

export interface AnalyticsSummary {
  from: string | null;
  to: string | null;
  totalRevenue: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  totalOrdersCount: number;
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: TopProductStat[];
  categorySales: CategorySalesStat[];
  topCategory: string | null;
  lowStockCount: number;
  orders: OrderSummary[];
}

export async function getAdminAnalytics(
  accessToken: string,
  filters: { from?: string; to?: string } = {}
): Promise<AnalyticsSummary> {
  const query = new URLSearchParams();
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  const qs = query.toString();

  const { analytics } = await api<{ analytics: AnalyticsSummary }>(
    `/api/admin/analytics${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return analytics;
}
