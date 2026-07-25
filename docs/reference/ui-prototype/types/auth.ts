import { Order } from './order';
import { AdminState, SalesAnalyticsSummary } from './admin';

export type UserRole = 'customer' | 'admin' | 'manager';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address?: string;
}

export type UserDashboardTab = 'overview' | 'orders' | 'favorites' | 'settings';

export interface UserDashboardState {
  activeTab: UserDashboardTab;
  profile: UserProfile;
  orderHistory: Order[];
  savedAddresses: string[];
  favoriteCount: number;
}

export interface AuthState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  userDashboard: UserDashboardState | null;
  adminDashboard: (AdminState & { analytics: SalesAnalyticsSummary }) | null;
  isLoading: boolean;
  error: string | null;
}
