import { CartItem, CartSummary } from './cart';
import { ContactDetails, FulfillmentMethod } from './checkout';

export type OrderStatus = 'received' | 'baking' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled';

export interface TrackingStep {
  id: number;
  label: string;
  sub: string;
  done: boolean;
  active?: boolean;
}

export interface Order {
  orderId: string;
  placedAt: string;
  estimatedDeliveryTime: string;
  status: OrderStatus;
  statusHeadline: string;
  fulfillmentMethod: FulfillmentMethod;
  contact: ContactDetails;
  items: CartItem[];
  summary: CartSummary;
  trackingSteps: TrackingStep[];
  isCancelled?: boolean;
  cancellationReason?: string;
  emailNotificationSent?: boolean;
}

export interface OrderTrackingState {
  currentOrder?: Order;
  trackingSteps: TrackingStep[];
  isLoading: boolean;
  error?: string;
}
