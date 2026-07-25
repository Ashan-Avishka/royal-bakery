export interface AdminUser {
  username: string;
  role: 'admin' | 'manager';
  isLoggedIn: boolean;
}

export interface SalesAnalyticsSummary {
  totalRevenue: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  topCategory: string;
  categorySales: { category: string; count: number; revenue: number }[];
}

export interface AdminState {
  user: AdminUser;
  activeTab: 'analytics' | 'orders' | 'products' | 'inventory';
  error?: string;
}
