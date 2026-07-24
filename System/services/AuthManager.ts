import {
  UserProfile,
  LoginCredentials,
  SignupCredentials,
  AuthState,
  UserDashboardState,
  UserDashboardTab,
} from '../types/auth';
import { OrderTrackingManager } from './OrderTrackingManager';
import { AdminManager } from './AdminManager';
import { CatalogManager } from './CatalogManager';

interface StoredAccount {
  profile: UserProfile;
  passwordHash: string;
}

export class AuthManager {
  private accounts: StoredAccount[] = [];
  private currentUser: UserProfile | null = null;
  private activeDashboardTab: UserDashboardTab = 'overview';
  private error: string | null = null;

  constructor() {
    this.seedMockAccounts();
  }

  private seedMockAccounts(): void {
    this.accounts = [
      {
        profile: {
          id: 'usr-101',
          name: 'Amara Perera',
          email: 'amara@example.com',
          phone: '+94 77 123 4567',
          address: 'No. 42, Temple Road, Colombo 03',
          role: 'customer',
          createdAt: '2024-01-15',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        },
        passwordHash: 'Password123!',
      },
      {
        profile: {
          id: 'usr-102',
          name: 'Kasun Kalhara',
          email: 'kasun@example.com',
          phone: '+94 71 987 6543',
          address: 'No. 15, Main Street, Kandy',
          role: 'customer',
          createdAt: '2024-03-20',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        },
        passwordHash: 'Kasun123!',
      },
      {
        profile: {
          id: 'admin-001',
          name: 'Royal Bakery Administrator',
          email: 'admin@royalbakery.lk',
          phone: '+94 11 234 5678',
          address: 'No. 12, Flower Road, Colombo 07',
          role: 'admin',
          createdAt: '2023-11-01',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
        },
        passwordHash: 'admin123',
      },
      {
        profile: {
          id: 'mgr-002',
          name: 'Bakery Operations Manager',
          email: 'manager@royalbakery.lk',
          phone: '+94 77 890 1234',
          address: 'No. 12, Flower Road, Colombo 07',
          role: 'manager',
          createdAt: '2023-12-10',
        },
        passwordHash: 'royal123',
      },
    ];
  }

  public signIn(credentials: LoginCredentials): { success: boolean; user?: UserProfile; message: string } {
    const target = credentials.emailOrUsername.trim().toLowerCase();
    const account = this.accounts.find(
      acc =>
        acc.profile.email.toLowerCase() === target ||
        (target === 'admin' && acc.profile.role === 'admin') ||
        (target === 'manager' && acc.profile.role === 'manager')
    );

    if (!account) {
      this.error = 'No account found with this email or username.';
      return { success: false, message: this.error };
    }

    if (account.passwordHash !== credentials.password) {
      this.error = 'Invalid password. Please check your credentials and try again.';
      return { success: false, message: this.error };
    }

    this.currentUser = { ...account.profile };
    this.error = null;
    return {
      success: true,
      user: this.currentUser,
      message: `Welcome back, ${this.currentUser.name}!`,
    };
  }

  public signUp(credentials: SignupCredentials): { success: boolean; user?: UserProfile; message: string } {
    const email = credentials.email.trim().toLowerCase();

    if (!credentials.name || credentials.name.trim().length < 2) {
      this.error = 'Please enter a valid full name.';
      return { success: false, message: this.error };
    }

    if (!email || !email.includes('@')) {
      this.error = 'Please enter a valid email address.';
      return { success: false, message: this.error };
    }

    const existing = this.accounts.find(acc => acc.profile.email.toLowerCase() === email);
    if (existing) {
      this.error = 'An account with this email address already exists. Please sign in instead.';
      return { success: false, message: this.error };
    }

    if (!credentials.password || credentials.password.length < 6) {
      this.error = 'Password must be at least 6 characters long.';
      return { success: false, message: this.error };
    }

    if (credentials.password !== credentials.confirmPassword) {
      this.error = 'Passwords do not match. Please ensure both passwords match.';
      return { success: false, message: this.error };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: credentials.name.trim(),
      email,
      phone: credentials.phone || '',
      address: credentials.address || '',
      role: 'customer',
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.accounts.push({
      profile: newUser,
      passwordHash: credentials.password,
    });

    this.currentUser = { ...newUser };
    this.error = null;

    return {
      success: true,
      user: this.currentUser,
      message: `Account created successfully! Welcome to Royal Bakery, ${newUser.name}.`,
    };
  }

  public signOut(): void {
    this.currentUser = null;
    this.error = null;
    this.activeDashboardTab = 'overview';
  }

  public updateProfile(
    userId: string,
    data: Partial<UserProfile>
  ): { success: boolean; user?: UserProfile; message: string } {
    const account = this.accounts.find(acc => acc.profile.id === userId);
    if (!account) {
      return { success: false, message: 'User profile not found.' };
    }

    account.profile = {
      ...account.profile,
      ...data,
      // Retain ID and role
      id: account.profile.id,
      role: account.profile.role,
    };

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...account.profile };
    }

    return {
      success: true,
      user: account.profile,
      message: 'Profile details updated successfully.',
    };
  }

  public setDashboardTab(tab: UserDashboardTab): void {
    this.activeDashboardTab = tab;
  }

  public clearError(): void {
    this.error = null;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  public getUserDashboardState(
    orderTrackingManager: OrderTrackingManager,
    favoriteIds: number[] = []
  ): UserDashboardState | null {
    if (!this.currentUser || this.currentUser.role !== 'customer') {
      return null;
    }

    const currentOrder = orderTrackingManager.getOrder();
    const orders = currentOrder ? [currentOrder] : [];
    const savedAddresses = this.currentUser.address ? [this.currentUser.address] : [];

    return {
      activeTab: this.activeDashboardTab,
      profile: { ...this.currentUser },
      orderHistory: orders,
      savedAddresses,
      favoriteCount: favoriteIds.length,
    };
  }

  public getAuthState(
    adminManager: AdminManager,
    catalogManager: CatalogManager,
    orderTrackingManager: OrderTrackingManager,
    favoriteIds: number[] = []
  ): AuthState {
    const currentUser = this.getCurrentUser();
    const isAuthenticated = !!currentUser;
    const role = currentUser ? currentUser.role : null;

    const userDashboard =
      currentUser && role === 'customer'
        ? this.getUserDashboardState(orderTrackingManager, favoriteIds)
        : null;

    const adminDashboard =
      currentUser && (role === 'admin' || role === 'manager')
        ? {
            user: adminManager.getUser(),
            activeTab: 'analytics' as const,
            analytics: adminManager.calculateAnalytics(catalogManager, orderTrackingManager),
          }
        : null;

    return {
      currentUser,
      isAuthenticated,
      role,
      userDashboard,
      adminDashboard,
      isLoading: false,
      error: this.error,
    };
  }
}
