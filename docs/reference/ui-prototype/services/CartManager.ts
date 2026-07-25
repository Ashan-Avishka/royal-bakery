import { CartItem, CartState, CartSummary, PromoCode } from '../types/cart';
import { Product } from '../types/catalog';
import { INITIAL_CART_ITEMS, PROMO_CODES } from '../data/mockData';

export class CartManager {
  private items: CartItem[];
  private appliedPromo?: PromoCode;
  private deliveryFee: number = 350;

  constructor(initialItems: CartItem[] = INITIAL_CART_ITEMS) {
    this.items = [...initialItems];
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public setDeliveryFee(fee: number): void {
    this.deliveryFee = fee;
  }

  public addItem(
    product: Product,
    size: string = '1kg',
    qty: number = 1,
    inscription?: string,
    deliveryDate?: string,
    candles?: number
  ): CartState {
    const existingIndex = this.items.findIndex(
      i => i.productId === product.id && i.size === size && i.inscription === inscription && i.candles === candles
    );

    if (existingIndex > -1) {
      this.items[existingIndex].qty += qty;
    } else {
      const newItem: CartItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        productId: product.id,
        name: product.name,
        size,
        price: product.numericPrice,
        qty,
        img: product.img,
        inscription,
        candles,
        deliveryDate,
      };
      this.items.push(newItem);
    }

    return this.getCartState();
  }

  public updateQuantity(itemId: number, qty: number): CartState {
    if (qty <= 0) {
      return this.removeItem(itemId);
    }
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.qty = qty;
    }
    return this.getCartState();
  }

  public removeItem(itemId: number): CartState {
    this.items = this.items.filter(i => i.id !== itemId);
    return this.getCartState();
  }

  public clearCart(): CartState {
    this.items = [];
    this.appliedPromo = undefined;
    return this.getCartState();
  }

  public applyPromo(code: string): { success: boolean; message: string; state: CartState } {
    const uppercaseCode = code.trim().toUpperCase();
    const promo = PROMO_CODES[uppercaseCode];

    if (promo) {
      this.appliedPromo = promo;
      return {
        success: true,
        message: `Promo code '${uppercaseCode}' applied! (${promo.discountPercentage}% off)`,
        state: this.getCartState(),
      };
    } else {
      return {
        success: false,
        message: `Invalid promo code: ${code}`,
        state: this.getCartState(),
      };
    }
  }

  public removePromo(): CartState {
    this.appliedPromo = undefined;
    return this.getCartState();
  }

  public calculateSummary(): CartSummary {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const itemCount = this.items.reduce((sum, item) => sum + item.qty, 0);

    let discount = 0;
    if (this.appliedPromo) {
      discount = Math.round((subtotal * this.appliedPromo.discountPercentage) / 100);
      if (this.appliedPromo.maxDiscount && discount > this.appliedPromo.maxDiscount) {
        discount = this.appliedPromo.maxDiscount;
      }
    }

    const effectiveSubtotal = Math.max(0, subtotal - discount);
    const tax = Math.round(effectiveSubtotal * 0.08);
    const delivery = this.items.length > 0 ? this.deliveryFee : 0;
    const total = effectiveSubtotal + delivery + tax;

    return {
      subtotal,
      deliveryFee: delivery,
      tax,
      discount,
      total,
      itemCount,
    };
  }

  public getCartState(): CartState {
    return {
      items: [...this.items],
      appliedPromo: this.appliedPromo ? { ...this.appliedPromo } : undefined,
      summary: this.calculateSummary(),
    };
  }
}
