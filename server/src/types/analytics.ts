import type { OrderStatus, OrderSummary } from "./order.js";

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
  /** Revenue from orders with payment_status = paid */
  totalRevenue: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  /** All orders in range (any payment status) */
  totalOrdersCount: number;
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: TopProductStat[];
  categorySales: CategorySalesStat[];
  topCategory: string | null;
  lowStockCount: number;
  /** Orders in range, newest first (capped) */
  orders: OrderSummary[];
}

export interface AnalyticsFilters {
  from?: string;
  to?: string;
}
