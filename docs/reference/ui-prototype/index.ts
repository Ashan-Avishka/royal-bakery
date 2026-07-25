// Domain Models & Types
export * from './types/catalog';
export * from './types/cart';
export * from './types/checkout';
export * from './types/order';
export * from './types/contact';
export * from './types/navigation';
export * from './types/admin';
export * from './types/auth';

// Initial Data
export * from './data/mockData';

// Services & Managers
export { CatalogManager } from './services/CatalogManager';
export { CartManager } from './services/CartManager';
export { CheckoutService } from './services/CheckoutService';
export { OrderTrackingManager } from './services/OrderTrackingManager';
export { ContactManager } from './services/ContactManager';
export { AdminManager } from './services/AdminManager';
export { AuthManager } from './services/AuthManager';

// Reactive State Store
export { BakeryStore, defaultBakeryStore } from './state/BakeryStore';
export type { SystemState, BakeryAction, StateListener } from './state/BakeryStore';
