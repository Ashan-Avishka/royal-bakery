import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Cart, CartItem } from "../types/cart.js";

interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
}

function mapCartItem(cartRow: CartItemRow, product: ProductRow): CartItem {
  const price = Number(product.price);
  return {
    productId: product.id,
    name: product.name,
    price,
    imageUrl: product.image_url,
    quantity: cartRow.quantity,
    subtotal: price * cartRow.quantity,
    stockQuantity: product.stock_quantity,
    isAvailable: product.is_available,
  };
}

export async function getCart(userId: string): Promise<Cart> {
  const { data: cartRows, error } = await getSupabaseAdmin()
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new AppError(500, "Failed to load cart", { cause: error });

  const rows = cartRows as CartItemRow[];
  const productIds = rows.map((r) => r.product_id);

  const products = new Map<string, ProductRow>();
  if (productIds.length > 0) {
    const { data: productRows, error: prodError } = await getSupabaseAdmin()
      .from("products")
      .select("*")
      .in("id", productIds);
    if (prodError) throw new AppError(500, "Failed to load cart products", { cause: prodError });
    for (const row of productRows as ProductRow[]) {
      products.set(row.id, row);
    }
  }

  const items = rows
    .map((row) => {
      const product = products.get(row.product_id);
      return product ? mapCartItem(row, product) : null;
    })
    .filter((item): item is CartItem => item !== null);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, subtotal };
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> {
  const { data: product, error: productError } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (productError) throw new AppError(500, "Failed to load product", { cause: productError });
  if (!product || !(product as ProductRow).is_available) {
    throw new AppError(404, "Product not found");
  }

  const { data: existing, error: existingError } = await getSupabaseAdmin()
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existingError) throw new AppError(500, "Failed to load cart item", { cause: existingError });

  const newQuantity = ((existing as CartItemRow | null)?.quantity ?? 0) + quantity;
  if (newQuantity > (product as ProductRow).stock_quantity) {
    throw new AppError(
      409,
      `Only ${(product as ProductRow).stock_quantity} of "${(product as ProductRow).name}" left in stock`
    );
  }

  if (existing) {
    const { error } = await getSupabaseAdmin()
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", (existing as CartItemRow).id);
    if (error) throw new AppError(500, "Failed to update cart item", { cause: error });
  } else {
    const { error } = await getSupabaseAdmin()
      .from("cart_items")
      .insert({ user_id: userId, product_id: productId, quantity: newQuantity });
    if (error) throw new AppError(500, "Failed to add cart item", { cause: error });
  }

  return getCart(userId);
}

export async function setCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> {
  const { data: product, error: productError } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (productError) throw new AppError(500, "Failed to load product", { cause: productError });
  if (!product) throw new AppError(404, "Product not found");
  if (quantity > (product as ProductRow).stock_quantity) {
    throw new AppError(
      409,
      `Only ${(product as ProductRow).stock_quantity} of "${(product as ProductRow).name}" left in stock`
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("cart_items")
    .update({ quantity })
    .eq("user_id", userId)
    .eq("product_id", productId)
    .select("*")
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to update cart item", { cause: error });
  if (!data) throw new AppError(404, "Item not in cart");

  return getCart(userId);
}

export async function removeCartItem(userId: string, productId: string): Promise<Cart> {
  const { error } = await getSupabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw new AppError(500, "Failed to remove cart item", { cause: error });
  return getCart(userId);
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  if (error) throw new AppError(500, "Failed to clear cart", { cause: error });
}
