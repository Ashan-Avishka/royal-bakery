import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type {
  AnalyticsFilters,
  AnalyticsSummary,
  CategorySalesStat,
  TopProductStat,
} from "../types/analytics.js";
import type { OrderStatus, OrderSummary, PaymentStatus } from "../types/order.js";

export const LOW_STOCK_THRESHOLD = 5;

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
  order_id: string;
  product_id: string;
  quantity: number;
  subtotal: string;
}

interface ProductRow {
  id: string;
  name: string;
  category_id: string | null;
  stock_quantity: number;
}

interface CategoryRow {
  id: string;
  name: string;
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

function emptyStatusCounts(): Record<OrderStatus, number> {
  return { pending: 0, processing: 0, completed: 0, cancelled: 0 };
}

/** Inclusive day bounds in UTC for YYYY-MM-DD filters. */
function dayBounds(from?: string, to?: string): { gte?: string; lte?: string } {
  const bounds: { gte?: string; lte?: string } = {};
  if (from) bounds.gte = `${from}T00:00:00.000Z`;
  if (to) bounds.lte = `${to}T23:59:59.999Z`;
  return bounds;
}

export async function getAnalyticsSummary(
  filters: AnalyticsFilters = {}
): Promise<AnalyticsSummary> {
  const bounds = dayBounds(filters.from, filters.to);
  const admin = getSupabaseAdmin();

  let ordersQuery = admin.from("orders").select("*");
  if (bounds.gte) ordersQuery = ordersQuery.gte("created_at", bounds.gte);
  if (bounds.lte) ordersQuery = ordersQuery.lte("created_at", bounds.lte);
  ordersQuery = ordersQuery.order("created_at", { ascending: false });

  const { data: orderData, error: ordersError } = await ordersQuery;
  if (ordersError) {
    throw new AppError(500, "Failed to load orders for analytics", {
      cause: ordersError,
    });
  }

  const orders = (orderData as OrderRow[]) ?? [];
  const ordersByStatus = emptyStatusCounts();
  for (const order of orders) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
  }

  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce(
    (sum, o) => sum + Number(o.total_amount),
    0
  );
  const paidOrdersCount = paidOrders.length;
  const averageOrderValue =
    paidOrdersCount > 0 ? Math.round((totalRevenue / paidOrdersCount) * 100) / 100 : 0;

  const paidIds = paidOrders.map((o) => o.id);
  let topProducts: TopProductStat[] = [];
  let categorySales: CategorySalesStat[] = [];
  let topCategory: string | null = null;

  if (paidIds.length > 0) {
    const { data: itemData, error: itemsError } = await admin
      .from("order_items")
      .select("*")
      .in("order_id", paidIds);
    if (itemsError) {
      throw new AppError(500, "Failed to load order items for analytics", {
        cause: itemsError,
      });
    }

    const items = (itemData as OrderItemRow[]) ?? [];
    const productIds = [...new Set(items.map((i) => i.product_id))];

    const productMap = new Map<string, ProductRow>();
    const categoryMap = new Map<string, string>();

    if (productIds.length > 0) {
      const { data: products, error: prodError } = await admin
        .from("products")
        .select("*")
        .in("id", productIds);
      if (prodError) {
        throw new AppError(500, "Failed to load products for analytics", {
          cause: prodError,
        });
      }
      for (const p of (products as ProductRow[]) ?? []) {
        productMap.set(p.id, p);
      }

      const categoryIds = [
        ...new Set(
          [...productMap.values()]
            .map((p) => p.category_id)
            .filter((id): id is string => Boolean(id))
        ),
      ];
      if (categoryIds.length > 0) {
        const { data: categories, error: catError } = await admin
          .from("categories")
          .select("*")
          .in("id", categoryIds);
        if (catError) {
          throw new AppError(500, "Failed to load categories for analytics", {
            cause: catError,
          });
        }
        for (const c of (categories as CategoryRow[]) ?? []) {
          categoryMap.set(c.id, c.name);
        }
      }
    }

    const productAgg = new Map<
      string,
      { name: string; quantitySold: number; revenue: number }
    >();
    const categoryAgg = new Map<string, { count: number; revenue: number }>();

    for (const item of items) {
      const product = productMap.get(item.product_id);
      const name = product?.name ?? "Unknown product";
      const qty = item.quantity;
      const revenue = Number(item.subtotal);

      const existing = productAgg.get(item.product_id) ?? {
        name,
        quantitySold: 0,
        revenue: 0,
      };
      existing.quantitySold += qty;
      existing.revenue += revenue;
      productAgg.set(item.product_id, existing);

      const categoryName = product?.category_id
        ? (categoryMap.get(product.category_id) ?? "Uncategorized")
        : "Uncategorized";
      const cat = categoryAgg.get(categoryName) ?? { count: 0, revenue: 0 };
      cat.count += qty;
      cat.revenue += revenue;
      categoryAgg.set(categoryName, cat);
    }

    topProducts = [...productAgg.entries()]
      .map(([productId, stat]) => ({
        productId,
        name: stat.name,
        quantitySold: stat.quantitySold,
        revenue: Math.round(stat.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    categorySales = [...categoryAgg.entries()]
      .map(([category, stat]) => ({
        category,
        count: stat.count,
        revenue: Math.round(stat.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    topCategory = categorySales[0]?.category ?? null;
  }

  const { data: stockProducts, error: stockError } = await admin
    .from("products")
    .select("*");
  if (stockError) {
    throw new AppError(500, "Failed to load stock for analytics", {
      cause: stockError,
    });
  }
  const lowStockCount = ((stockProducts as ProductRow[]) ?? []).filter(
    (p) => p.stock_quantity <= LOW_STOCK_THRESHOLD
  ).length;

  return {
    from: filters.from ?? null,
    to: filters.to ?? null,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    paidOrdersCount,
    averageOrderValue,
    totalOrdersCount: orders.length,
    ordersByStatus,
    topProducts,
    categorySales,
    topCategory,
    lowStockCount,
    orders: orders.slice(0, 100).map(mapOrderSummary),
  };
}
