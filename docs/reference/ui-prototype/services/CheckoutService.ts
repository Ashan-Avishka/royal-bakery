import {
  CheckoutState,
  CheckoutStepNumber,
  ContactDetails,
  CardDetails,
  FulfillmentMethod,
  PaymentMethod,
  CheckoutPayload,
} from '../types/checkout';
import { Order, OrderStatus } from '../types/order';

export class CheckoutService {
  private state: CheckoutState;

  constructor() {
    this.state = {
      step: 1,
      contact: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
      },
      fulfillmentMethod: 'delivery',
      paymentMethod: 'card',
      cardDetails: {
        cardNumber: '',
        expiry: '',
        cvv: '',
      },
      isSubmitting: false,
    };
  }

  public getState(): CheckoutState {
    return { ...this.state };
  }

  public setStep(step: CheckoutStepNumber): CheckoutState {
    this.state.step = step;
    return this.getState();
  }

  public setFulfillmentMethod(method: FulfillmentMethod): CheckoutState {
    this.state.fulfillmentMethod = method;
    return this.getState();
  }

  public setPaymentMethod(method: PaymentMethod): CheckoutState {
    this.state.paymentMethod = method;
    return this.getState();
  }

  public updateContact(details: Partial<ContactDetails>): CheckoutState {
    this.state.contact = { ...this.state.contact, ...details };
    return this.getState();
  }

  public updateCardDetails(details: Partial<CardDetails>): CheckoutState {
    this.state.cardDetails = { ...this.state.cardDetails, ...details };
    return this.getState();
  }

  public validateStep(step: CheckoutStepNumber): { valid: boolean; error?: string } {
    if (step === 1) {
      const { firstName, lastName, email, phone, address } = this.state.contact;
      if (!firstName.trim() || !lastName.trim()) {
        return { valid: false, error: 'First name and Last name are required.' };
      }
      if (!email.trim() || !email.includes('@')) {
        return { valid: false, error: 'Please enter a valid email address.' };
      }
      if (!phone.trim()) {
        return { valid: false, error: 'Phone number is required.' };
      }
      if (this.state.fulfillmentMethod === 'delivery' && (!address || !address.trim())) {
        return { valid: false, error: 'Delivery address is required for home delivery.' };
      }
    } else if (step === 2) {
      if (this.state.paymentMethod === 'card') {
        const { cardNumber, expiry, cvv } = this.state.cardDetails;
        if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 12) {
          return { valid: false, error: 'Please enter a valid 16-digit card number.' };
        }
        if (!expiry.trim()) {
          return { valid: false, error: 'Expiry date is required (MM/YY).' };
        }
        if (!cvv.trim() || cvv.length < 3) {
          return { valid: false, error: 'Valid CVV security code is required.' };
        }
      }
    }
    return { valid: true };
  }

  public createOrderFromCheckout(payload: CheckoutPayload): Order {
    const orderId = `RB-2024-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const placedAt = now.toLocaleString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const initialStatus: OrderStatus = 'received';

    return {
      orderId,
      placedAt,
      estimatedDeliveryTime: '4:00 PM – 6:00 PM',
      status: initialStatus,
      statusHeadline: 'Order Received & Queued',
      fulfillmentMethod: payload.fulfillmentMethod,
      contact: { ...payload.contact },
      items: [...payload.items],
      summary: { ...payload.summary },
      trackingSteps: [
        { id: 1, label: 'Order Received', sub: 'Just now', done: true, active: false },
        { id: 2, label: 'Baking in Oven', sub: 'Estimated 30 mins', done: false, active: true },
        { id: 3, label: 'Ready for Pickup', sub: 'Estimated 4:00 PM', done: false },
        { id: 4, label: 'Out for Delivery', sub: 'Estimated 4:30 PM', done: false },
        { id: 5, label: 'Delivered', sub: 'Estimated 5:30 PM', done: false },
      ],
    };
  }
}
