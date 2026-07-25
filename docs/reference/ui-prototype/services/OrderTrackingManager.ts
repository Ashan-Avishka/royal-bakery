import { Order, OrderStatus, TrackingStep } from '../types/order';
import { INITIAL_ORDER } from '../data/mockData';

export class OrderTrackingManager {
  private currentOrder: Order;

  constructor(initialOrder: Order = INITIAL_ORDER) {
    this.currentOrder = { ...initialOrder };
  }

  public getOrder(): Order {
    return { ...this.currentOrder };
  }

  public setOrder(order: Order): Order {
    this.currentOrder = { ...order };
    return this.getOrder();
  }

  public cancelOrder(reason: string = 'Requested by customer'): { success: boolean; message: string; order: Order } {
    if (this.currentOrder.status === 'baking' || this.currentOrder.status === 'ready' || this.currentOrder.status === 'out-for-delivery' || this.currentOrder.status === 'delivered') {
      return {
        success: false,
        message: 'Order cannot be cancelled once baking/processing has started.',
        order: this.getOrder(),
      };
    }

    this.currentOrder.status = 'cancelled';
    this.currentOrder.statusHeadline = 'Order Cancelled';
    this.currentOrder.isCancelled = true;
    this.currentOrder.cancellationReason = reason;

    return {
      success: true,
      message: 'Your order has been successfully cancelled and refund initiated.',
      order: this.getOrder(),
    };
  }

  public updateOrderStatus(status: OrderStatus): Order {
    this.currentOrder.status = status;
    const statusHeadlines: Record<OrderStatus, string> = {
      received: 'Order Received',
      baking: 'Baking in Progress',
      ready: 'Ready for Pickup',
      'out-for-delivery': 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Order Cancelled',
    };
    this.currentOrder.statusHeadline = statusHeadlines[status];

    const stepIndexMap: Record<OrderStatus, number> = {
      received: 1,
      baking: 2,
      ready: 3,
      'out-for-delivery': 4,
      delivered: 5,
      cancelled: 0,
    };

    const activeStepId = stepIndexMap[status];

    this.currentOrder.trackingSteps = this.currentOrder.trackingSteps.map(step => {
      if (step.id < activeStepId) {
        return { ...step, done: true, active: false };
      } else if (step.id === activeStepId) {
        return { ...step, done: false, active: true };
      } else {
        return { ...step, done: false, active: false };
      }
    });

    return this.getOrder();
  }

  public getTrackingSteps(): TrackingStep[] {
    return [...this.currentOrder.trackingSteps];
  }
}
