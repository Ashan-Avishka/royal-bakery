import { api, ApiError } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listCategories(): Promise<Category[]> {
  const { categories } = await api<{ categories: Category[] }>(
    "/api/categories"
  );
  return categories;
}

export async function listProducts(params?: {
  categoryId?: string;
  search?: string;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();

  const { products } = await api<{ products: Product[] }>(
    `/api/products${qs ? `?${qs}` : ""}`
  );
  return products;
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const { product } = await api<{ product: Product }>(`/api/products/${id}`);
    return product;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export function formatPrice(price: number): string {
  return `LKR ${price.toLocaleString("en-US")}`;
}
