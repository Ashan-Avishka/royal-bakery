import { AdminUser, SalesAnalyticsSummary } from '../types/admin';
import { CatalogManager } from './CatalogManager';
import { OrderTrackingManager } from './OrderTrackingManager';
import { Product, StockStatus } from '../types/catalog';
import { OrderStatus } from '../types/order';

export class AdminManager {
  private user: AdminUser = {
    username: 'admin',
    role: 'admin',
    isLoggedIn: false,
  };

  public login(pass: string): boolean {
    if (pass === 'admin123' || pass === 'royal123' || pass === 'admin') {
      this.user.isLoggedIn = true;
      return true;
    }
    return false;
  }

  public logout(): void {
    this.user.isLoggedIn = false;
  }

  public getUser(): AdminUser {
    return { ...this.user };
  }

  public calculateAnalytics(
    catalogManager: CatalogManager,
    orderTrackingManager: OrderTrackingManager
  ): SalesAnalyticsSummary {
    const products = catalogManager.getAllProducts();
    const order = orderTrackingManager.getOrder();
    const items = order.items || [];

    const totalOrdersCount = 124; // Simulated baseline + live order
    const totalRevenue = 548200 + (order.summary ? order.summary.total : 0);
    const averageOrderValue = Math.round(totalRevenue / totalOrdersCount);

    const categoryMap: Record<string, { count: number; revenue: number }> = {
      Cakes: { count: 48, revenue: 210000 },
      Pastries: { count: 36, revenue: 142000 },
      Breads: { count: 22, revenue: 68000 },
      Cookies: { count: 18, revenue: 45000 },
      'Custom Sweets': { count: 12, revenue: 83200 },
    };

    items.forEach(item => {
      const cat = products.find(p => p.id === item.productId)?.category || 'Pastries';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, revenue: 0 };
      }
      categoryMap[cat].count += item.qty;
      categoryMap[cat].revenue += item.price * item.qty;
    });

    const categorySales = Object.keys(categoryMap).map(cat => ({
      category: cat,
      count: categoryMap[cat].count,
      revenue: categoryMap[cat].revenue,
    }));

    categorySales.sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalOrdersCount,
      averageOrderValue,
      topCategory: categorySales[0]?.category || 'Cakes',
      categorySales,
    };
  }

  public addProduct(catalogManager: CatalogManager, newProduct: Omit<Product, 'id'>): Product {
    const existing = catalogManager.getAllProducts();
    const id = existing.length > 0 ? Math.max(...existing.map(p => p.id)) + 1 : 1;

    const product: Product = {
      ...newProduct,
      id,
    };

    existing.push(product);
    return product;
  }

  public updateStock(catalogManager: CatalogManager, productId: number, stock: StockStatus): void {
    const product = catalogManager.getProductById(productId);
    if (product) {
      product.stock = stock;
    }
  }

  public updateOrderStatus(orderTrackingManager: OrderTrackingManager, status: OrderStatus): void {
    orderTrackingManager.updateOrderStatus(status);
  }
}
