import { api, ApiError } from "@/lib/api";
import type { Category, Product } from "@/lib/catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const LOW_STOCK_THRESHOLD = 5;

export type { Category, Product };

export async function listAdminCategories(
  accessToken: string
): Promise<Category[]> {
  const { categories } = await api<{ categories: Category[] }>(
    "/api/admin/categories",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return categories;
}

export async function createAdminCategory(
  accessToken: string,
  input: { name: string; description?: string }
): Promise<Category> {
  const { category } = await api<{ category: Category }>(
    "/api/admin/categories",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    }
  );
  return category;
}

export async function updateAdminCategory(
  accessToken: string,
  id: string,
  input: { name?: string; description?: string; isActive?: boolean }
): Promise<Category> {
  const { category } = await api<{ category: Category }>(
    `/api/admin/categories/${id}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    }
  );
  return category;
}

export async function deleteAdminCategory(
  accessToken: string,
  id: string
): Promise<void> {
  await api<void>(`/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function listAdminProducts(
  accessToken: string,
  filters: { categoryId?: string; search?: string } = {}
): Promise<Product[]> {
  const query = new URLSearchParams();
  if (filters.categoryId) query.set("categoryId", filters.categoryId);
  if (filters.search) query.set("search", filters.search);
  const qs = query.toString();

  const { products } = await api<{ products: Product[] }>(
    `/api/admin/products${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return products;
}

export async function getAdminProduct(
  accessToken: string,
  id: string
): Promise<Product | null> {
  const products = await listAdminProducts(accessToken);
  return products.find((p) => p.id === id) ?? null;
}

export async function createAdminProduct(
  accessToken: string,
  input: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string | null;
    stockQuantity?: number;
    isAvailable?: boolean;
  }
): Promise<Product> {
  const { product } = await api<{ product: Product }>("/api/admin/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
  return product;
}

export async function updateAdminProduct(
  accessToken: string,
  id: string,
  input: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string | null;
    stockQuantity?: number;
    isAvailable?: boolean;
  }
): Promise<Product> {
  const { product } = await api<{ product: Product }>(
    `/api/admin/products/${id}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    }
  );
  return product;
}

export async function deleteAdminProduct(
  accessToken: string,
  id: string
): Promise<void> {
  await api<void>(`/api/admin/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/** Multipart upload — must not set Content-Type (browser/fetch sets the boundary). */
export async function uploadAdminProductImage(
  accessToken: string,
  id: string,
  file: Blob,
  filename = "image.jpg"
): Promise<Product> {
  const body = new FormData();
  body.append("image", file, filename);

  const response = await fetch(`${API_URL}/api/admin/products/${id}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = (await response.json()) as { error?: { message?: string } };
      message = data.error?.message ?? message;
    } catch {
      // keep statusText
    }
    throw new ApiError(response.status, message);
  }

  const data = (await response.json()) as { product: Product };
  return data.product;
}

export function stockLabel(stockQuantity: number): {
  label: string;
  tone: "success" | "warning" | "muted";
} {
  if (stockQuantity <= 0) return { label: "Out of stock", tone: "muted" };
  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return { label: "Low stock", tone: "warning" };
  }
  return { label: "In stock", tone: "success" };
}
