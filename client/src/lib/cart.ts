import { api } from "@/lib/api";

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

export async function getCart(accessToken: string): Promise<Cart> {
  const { cart } = await api<{ cart: Cart }>("/api/cart", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return cart;
}
