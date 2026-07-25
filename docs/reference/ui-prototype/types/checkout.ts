import { CartItem, CartSummary } from './cart';

export type FulfillmentMethod = 'delivery' | 'pickup';

export type PaymentMethod = 'card' | 'bank';

export type DeliveryTimeSlot =
  | '9:00 AM – 11:00 AM'
  | '11:00 AM – 1:00 PM'
  | '2:00 PM – 4:00 PM'
  | '4:00 PM – 6:00 PM';

export type CheckoutStepNumber = 1 | 2 | 3;

export interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  deliveryTimeSlot?: DeliveryTimeSlot;
}

export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface CheckoutState {
  step: CheckoutStepNumber;
  contact: ContactDetails;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  cardDetails: CardDetails;
  isSubmitting: boolean;
  error?: string;
}

export interface CheckoutPayload {
  contact: ContactDetails;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  cardDetails?: CardDetails;
  items: CartItem[];
  summary: CartSummary;
}
