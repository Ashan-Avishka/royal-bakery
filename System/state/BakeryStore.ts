import { Screen, NavigationState } from '../types/navigation';
import { Product, ProductCategory, StockStatus, DietaryTag } from '../types/catalog';
import { CartState } from '../types/cart';
import { CheckoutState, CheckoutStepNumber, FulfillmentMethod, PaymentMethod, ContactDetails, CardDetails, DeliveryTimeSlot } from '../types/checkout';
import { Order, OrderStatus, OrderTrackingState } from '../types/order';
import { ContactInquiry, ContactState } from '../types/contact';
import { AdminState, SalesAnalyticsSummary } from '../types/admin';
import { AuthState, LoginCredentials, SignupCredentials, UserProfile, UserDashboardTab } from '../types/auth';

import { CatalogManager } from '../services/CatalogManager';
import { CartManager } from '../services/CartManager';
import { CheckoutService } from '../services/CheckoutService';
import { OrderTrackingManager } from '../services/OrderTrackingManager';
import { ContactManager } from '../services/ContactManager';
import { AdminManager } from '../services/AdminManager';
import { AuthManager } from '../services/AuthManager';
import { SYSTEM_SCREENS } from '../data/mockData';

export interface SystemState {
  navigation: NavigationState;
  catalog: {
    products: Product[];
    filteredProducts: Product[];
    activeCategory: ProductCategory;
    activeDietaryTag?: DietaryTag;
    favoriteIds: number[];
    searchQuery: string;
    selectedProduct?: Product;
    showFavoritesOnly: boolean;
  };
  cart: CartState;
  checkout: CheckoutState;
  tracking: OrderTrackingState;
  contact: ContactState;
  admin: AdminState & { analytics: SalesAnalyticsSummary };
  auth: AuthState;
  notifications: { id: number; message: string; type: 'info' | 'success' | 'warning' }[];
  showInvoiceModal: boolean;
}

export type BakeryAction =
  | { type: 'NAVIGATE'; payload: { screen: Screen; productId?: number } }
  | { type: 'SET_CATEGORY_FILTER'; payload: ProductCategory }
  | { type: 'SET_DIETARY_FILTER'; payload: DietaryTag | undefined }
  | { type: 'TOGGLE_FAVORITES_ONLY' }
  | { type: 'TOGGLE_FAVORITE'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SELECT_PRODUCT'; payload: number | null }
  | { type: 'ADD_TO_CART'; payload: { product: Product; size?: string; qty?: number; inscription?: string; candles?: number; deliveryDate?: string } }
  | { type: 'UPDATE_CART_QTY'; payload: { itemId: number; qty: number } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'APPLY_PROMO'; payload: string }
  | { type: 'SET_CHECKOUT_STEP'; payload: CheckoutStepNumber }
  | { type: 'SET_FULFILLMENT'; payload: FulfillmentMethod }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_CHECKOUT_CONTACT'; payload: Partial<ContactDetails> }
  | { type: 'UPDATE_CHECKOUT_CARD'; payload: Partial<CardDetails> }
  | { type: 'SUBMIT_CHECKOUT' }
  | { type: 'SUBMIT_CONTACT'; payload: ContactInquiry }
  | { type: 'SUBMIT_PRODUCT_REVIEW'; payload: { productId: number; author: string; rating: number; comment: string } }
  | { type: 'CANCEL_ORDER'; payload?: string }
  | { type: 'SET_SHOW_INVOICE'; payload: boolean }
  | { type: 'SIGN_IN'; payload: LoginCredentials }
  | { type: 'SIGN_UP'; payload: SignupCredentials }
  | { type: 'SIGN_OUT' }
  | { type: 'UPDATE_PROFILE'; payload: { userId: string; data: Partial<UserProfile> } }
  | { type: 'CLEAR_AUTH_ERROR' }
  | { type: 'SET_DASHBOARD_TAB'; payload: UserDashboardTab }
  | { type: 'ADMIN_LOGIN'; payload: string }
  | { type: 'ADMIN_LOGOUT' }
  | { type: 'ADMIN_SET_TAB'; payload: 'analytics' | 'orders' | 'products' | 'inventory' }
  | { type: 'ADMIN_UPDATE_STOCK'; payload: { productId: number; stock: StockStatus } }
  | { type: 'ADMIN_UPDATE_ORDER_STATUS'; payload: OrderStatus }
  | { type: 'ADMIN_ADD_PRODUCT'; payload: Omit<Product, 'id'> };

export type StateListener = (state: SystemState) => void;

export class BakeryStore {
  private catalogManager: CatalogManager;
  private cartManager: CartManager;
  private checkoutService: CheckoutService;
  private orderTrackingManager: OrderTrackingManager;
  private contactManager: ContactManager;
  private adminManager: AdminManager;
  private authManager: AuthManager;

  private activeScreen: Screen = 'home';
  private selectedProductId?: number;
  private activeCategory: ProductCategory = 'All';
  private activeDietaryTag?: DietaryTag;
  private favoriteIds: number[] = [1, 2];
  private showFavoritesOnly: boolean = false;
  private searchQuery: string = '';
  private contactState: ContactState;
  private adminTab: 'analytics' | 'orders' | 'products' | 'inventory' = 'analytics';
  private notifications: { id: number; message: string; type: 'info' | 'success' | 'warning' }[] = [];
  private showInvoiceModal: boolean = false;

  private cachedState: SystemState;
  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.catalogManager = new CatalogManager();
    this.cartManager = new CartManager();
    this.checkoutService = new CheckoutService();
    this.orderTrackingManager = new OrderTrackingManager();
    this.contactManager = new ContactManager();
    this.adminManager = new AdminManager();
    this.authManager = new AuthManager();

    this.contactState = {
      inquiry: {
        fullName: '',
        phone: '',
        email: '',
        subject: 'Custom Cake Order',
        message: '',
      },
      isSubmitting: false,
      submitted: false,
    };

    this.cachedState = this.computeState();
  }

  private addNotification(message: string, type: 'info' | 'success' | 'warning' = 'info') {
    const notif = { id: Date.now(), message, type };
    this.notifications = [notif, ...this.notifications].slice(0, 3);
  }

  private autoFillCheckoutFromUser(user: UserProfile) {
    const names = user.name.split(' ');
    const firstName = names[0] || user.name;
    const lastName = names.slice(1).join(' ') || '';

    this.checkoutService.updateContact({
      firstName,
      lastName,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
    });
  }

  private computeState(): SystemState {
    const products = this.catalogManager.getAllProducts();
    const filteredProducts = this.catalogManager.filterProducts({
      category: this.activeCategory,
      dietaryTag: this.activeDietaryTag,
      favoriteIds: this.showFavoritesOnly ? this.favoriteIds : undefined,
      searchQuery: this.searchQuery,
    });
    const selectedProduct = this.selectedProductId
      ? this.catalogManager.getProductById(this.selectedProductId)
      : undefined;

    const analytics = this.adminManager.calculateAnalytics(
      this.catalogManager,
      this.orderTrackingManager
    );

    const auth = this.authManager.getAuthState(
      this.adminManager,
      this.catalogManager,
      this.orderTrackingManager,
      this.favoriteIds
    );

    return {
      navigation: {
        activeScreen: this.activeScreen,
        screens: SYSTEM_SCREENS,
        selectedProductId: this.selectedProductId,
      },
      catalog: {
        products,
        filteredProducts,
        activeCategory: this.activeCategory,
        activeDietaryTag: this.activeDietaryTag,
        favoriteIds: [...this.favoriteIds],
        searchQuery: this.searchQuery,
        selectedProduct,
        showFavoritesOnly: this.showFavoritesOnly,
      },
      cart: this.cartManager.getCartState(),
      checkout: this.checkoutService.getState(),
      tracking: {
        currentOrder: this.orderTrackingManager.getOrder(),
        trackingSteps: this.orderTrackingManager.getTrackingSteps(),
        isLoading: false,
      },
      contact: { ...this.contactState },
      admin: {
        user: this.adminManager.getUser(),
        activeTab: this.adminTab,
        analytics,
      },
      auth,
      notifications: [...this.notifications],
      showInvoiceModal: this.showInvoiceModal,
    };
  }

  public getState(): SystemState {
    return this.cachedState;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.cachedState = this.computeState();
    this.listeners.forEach(listener => listener(this.cachedState));
  }

  public dispatch(action: BakeryAction): SystemState {
    switch (action.type) {
      case 'NAVIGATE':
        this.activeScreen = action.payload.screen;
        if (action.payload.productId !== undefined) {
          this.selectedProductId = action.payload.productId;
        }
        break;

      case 'SET_CATEGORY_FILTER':
        this.activeCategory = action.payload;
        this.showFavoritesOnly = false;
        break;

      case 'SET_DIETARY_FILTER':
        this.activeDietaryTag = action.payload;
        break;

      case 'TOGGLE_FAVORITES_ONLY':
        this.showFavoritesOnly = !this.showFavoritesOnly;
        break;

      case 'TOGGLE_FAVORITE': {
        const id = action.payload;
        if (this.favoriteIds.includes(id)) {
          this.favoriteIds = this.favoriteIds.filter(fId => fId !== id);
          this.addNotification('Removed item from Wishlist', 'info');
        } else {
          this.favoriteIds.push(id);
          this.addNotification('Saved item to Wishlist ❤️', 'success');
        }
        break;
      }

      case 'SET_SEARCH_QUERY':
        this.searchQuery = action.payload;
        break;

      case 'SELECT_PRODUCT':
        this.selectedProductId = action.payload || undefined;
        if (action.payload) {
          this.activeScreen = 'product';
        }
        break;

      case 'ADD_TO_CART':
        this.cartManager.addItem(
          action.payload.product,
          action.payload.size,
          action.payload.qty,
          action.payload.inscription,
          action.payload.deliveryDate,
          action.payload.candles
        );
        this.addNotification(`Added ${action.payload.product.name} to basket!`, 'success');
        break;

      case 'UPDATE_CART_QTY':
        this.cartManager.updateQuantity(action.payload.itemId, action.payload.qty);
        break;

      case 'REMOVE_FROM_CART':
        this.cartManager.removeItem(action.payload);
        this.addNotification('Item removed from basket', 'info');
        break;

      case 'APPLY_PROMO': {
        const res = this.cartManager.applyPromo(action.payload);
        this.addNotification(res.message, res.success ? 'success' : 'warning');
        break;
      }

      case 'SET_CHECKOUT_STEP':
        this.checkoutService.setStep(action.payload);
        break;

      case 'SET_FULFILLMENT':
        this.checkoutService.setFulfillmentMethod(action.payload);
        this.cartManager.setDeliveryFee(action.payload === 'delivery' ? 350 : 0);
        break;

      case 'SET_PAYMENT_METHOD':
        this.checkoutService.setPaymentMethod(action.payload);
        break;

      case 'UPDATE_CHECKOUT_CONTACT':
        this.checkoutService.updateContact(action.payload);
        break;

      case 'UPDATE_CHECKOUT_CARD':
        this.checkoutService.updateCardDetails(action.payload);
        break;

      case 'SUBMIT_CHECKOUT': {
        const checkoutState = this.checkoutService.getState();
        const cartState = this.cartManager.getCartState();

        const newOrder: Order = this.checkoutService.createOrderFromCheckout({
          contact: checkoutState.contact,
          fulfillmentMethod: checkoutState.fulfillmentMethod,
          paymentMethod: checkoutState.paymentMethod,
          cardDetails: checkoutState.cardDetails,
          items: cartState.items,
          summary: cartState.summary,
        });

        this.orderTrackingManager.setOrder(newOrder);
        this.checkoutService.setStep(3);
        this.cartManager.clearCart();
        this.addNotification(`Order #${newOrder.orderId} confirmed! Email confirmation sent.`, 'success');
        break;
      }

      case 'SUBMIT_CONTACT': {
        this.contactState.isSubmitting = true;
        const res = this.contactManager.submitInquiry(action.payload);
        this.contactState = {
          inquiry: action.payload,
          isSubmitting: false,
          submitted: res.success,
          resultMessage: res.message,
        };
        this.addNotification(res.message, res.success ? 'success' : 'warning');
        break;
      }

      case 'SUBMIT_PRODUCT_REVIEW': {
        const { productId, author, rating, comment } = action.payload;
        this.catalogManager.addReview(productId, author, rating, comment);
        this.addNotification('Thank you for reviewing this pastry!', 'success');
        break;
      }

      case 'CANCEL_ORDER': {
        const res = this.orderTrackingManager.cancelOrder(action.payload);
        this.addNotification(res.message, res.success ? 'info' : 'warning');
        break;
      }

      case 'SET_SHOW_INVOICE':
        this.showInvoiceModal = action.payload;
        break;

      case 'SIGN_IN': {
        const res = this.authManager.signIn(action.payload);
        if (res.success && res.user) {
          if (res.user.role === 'customer') {
            this.autoFillCheckoutFromUser(res.user);
            this.activeScreen = 'dashboard';
          } else if (res.user.role === 'admin' || res.user.role === 'manager') {
            this.adminManager.login(action.payload.password);
            this.activeScreen = 'admin-dashboard';
          }
          this.addNotification(res.message, 'success');
        } else {
          this.addNotification(res.message, 'warning');
        }
        break;
      }

      case 'SIGN_UP': {
        const res = this.authManager.signUp(action.payload);
        if (res.success && res.user) {
          this.autoFillCheckoutFromUser(res.user);
          this.activeScreen = 'dashboard';
          this.addNotification(res.message, 'success');
        } else {
          this.addNotification(res.message, 'warning');
        }
        break;
      }

      case 'SIGN_OUT': {
        const user = this.authManager.getCurrentUser();
        this.authManager.signOut();
        this.adminManager.logout();
        this.activeScreen = 'home';
        this.addNotification(user ? `Signed out ${user.name}` : 'Signed out successfully', 'info');
        break;
      }

      case 'UPDATE_PROFILE': {
        const res = this.authManager.updateProfile(action.payload.userId, action.payload.data);
        if (res.success) {
          this.addNotification(res.message, 'success');
        } else {
          this.addNotification(res.message, 'warning');
        }
        break;
      }

      case 'CLEAR_AUTH_ERROR':
        this.authManager.clearError();
        break;

      case 'SET_DASHBOARD_TAB':
        this.authManager.setDashboardTab(action.payload);
        break;

      case 'ADMIN_LOGIN':
        this.adminManager.login(action.payload);
        this.authManager.signIn({ emailOrUsername: 'admin', password: action.payload });
        this.addNotification('Admin authenticated successfully', 'success');
        break;

      case 'ADMIN_LOGOUT':
        this.adminManager.logout();
        this.authManager.signOut();
        this.addNotification('Admin logged out', 'info');
        break;

      case 'ADMIN_SET_TAB':
        this.adminTab = action.payload;
        break;

      case 'ADMIN_UPDATE_STOCK':
        this.adminManager.updateStock(
          this.catalogManager,
          action.payload.productId,
          action.payload.stock
        );
        this.addNotification('Stock level updated in real-time', 'success');
        break;

      case 'ADMIN_UPDATE_ORDER_STATUS':
        this.adminManager.updateOrderStatus(this.orderTrackingManager, action.payload);
        this.addNotification(`Order status updated to ${action.payload.toUpperCase()}`, 'info');
        break;

      case 'ADMIN_ADD_PRODUCT':
        this.adminManager.addProduct(this.catalogManager, action.payload);
        this.addNotification(`Published new product: ${action.payload.name}`, 'success');
        break;
    }

    this.notify();
    return this.getState();
  }

  // Direct manager accessors
  public getCatalogManager(): CatalogManager {
    return this.catalogManager;
  }

  public getCartManager(): CartManager {
    return this.cartManager;
  }

  public getCheckoutService(): CheckoutService {
    return this.checkoutService;
  }

  public getOrderTrackingManager(): OrderTrackingManager {
    return this.orderTrackingManager;
  }

  public getContactManager(): ContactManager {
    return this.contactManager;
  }

  public getAdminManager(): AdminManager {
    return this.adminManager;
  }

  public getAuthManager(): AuthManager {
    return this.authManager;
  }
}

export const defaultBakeryStore = new BakeryStore();
