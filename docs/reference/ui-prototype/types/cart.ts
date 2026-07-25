export interface CartItem {
  id: number;
  productId?: number;
  name: string;
  size: string;
  price: number;
  qty: number;
  img: string;
  inscription?: string;
  candles?: number;
  deliveryDate?: string;
}

export interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  maxDiscount?: number;
  description: string;
}

export interface CartState {
  items: CartItem[];
  appliedPromo?: PromoCode;
  summary: CartSummary;
}
