export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}
