import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Category, Product } from "../types/catalog.js";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function listCategories(
  options: { activeOnly: boolean } = { activeOnly: false }
): Promise<Category[]> {
  let query = getSupabaseAdmin().from("categories").select("*");
  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new AppError(500, "Failed to list categories", { cause: error });
  return (data as CategoryRow[]).map(mapCategory);
}

export async function createCategory(fields: {
  name: string;
  description?: string;
}): Promise<Category> {
  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .insert({ name: fields.name, description: fields.description ?? null, is_active: true })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new AppError(409, `A category named "${fields.name}" already exists`);
    }
    throw new AppError(500, "Failed to create category", { cause: error });
  }
  return mapCategory(data as CategoryRow);
}

export async function updateCategory(
  id: string,
  fields: { name?: string; description?: string; isActive?: boolean }
): Promise<Category> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.isActive !== undefined) update.is_active = fields.isActive;

  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new AppError(404, "Category not found");
    if (error.code === "23505") {
      throw new AppError(409, `A category named "${fields.name}" already exists`);
    }
    throw new AppError(500, "Failed to update category", { cause: error });
  }
  return mapCategory(data as CategoryRow);
}

export async function deleteCategory(id: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to delete category", { cause: error });
  if (!data) throw new AppError(404, "Category not found");
}

interface ProductRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    imageUrl: row.image_url,
    stockQuantity: row.stock_quantity,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(filters: {
  categoryId?: string;
  search?: string;
  availableOnly: boolean;
}): Promise<Product[]> {
  let query = getSupabaseAdmin().from("products").select("*");
  if (filters.availableOnly) query = query.eq("is_available", true);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list products", { cause: error });
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load product", { cause: error });
  return data ? mapProduct(data as ProductRow) : null;
}

export async function createProduct(fields: {
  name: string;
  description?: string;
  price: number;
  categoryId?: string | null;
  stockQuantity?: number;
  isAvailable?: boolean;
}): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({
      name: fields.name,
      description: fields.description ?? null,
      price: fields.price,
      category_id: fields.categoryId ?? null,
      stock_quantity: fields.stockQuantity ?? 0,
      is_available: fields.isAvailable ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new AppError(500, "Failed to create product", { cause: error });
  return mapProduct(data as ProductRow);
}

export async function updateProduct(
  id: string,
  fields: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string | null;
    stockQuantity?: number;
    isAvailable?: boolean;
    imageUrl?: string | null;
  }
): Promise<Product> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.price !== undefined) update.price = fields.price;
  if (fields.categoryId !== undefined) update.category_id = fields.categoryId;
  if (fields.stockQuantity !== undefined) update.stock_quantity = fields.stockQuantity;
  if (fields.isAvailable !== undefined) update.is_available = fields.isAvailable;
  if (fields.imageUrl !== undefined) update.image_url = fields.imageUrl;

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new AppError(404, "Product not found");
    throw new AppError(500, "Failed to update product", { cause: error });
  }
  return mapProduct(data as ProductRow);
}

export async function setProductImage(id: string, imageUrl: string): Promise<Product> {
  return updateProduct(id, { imageUrl });
}

export async function clearProductImage(id: string): Promise<Product> {
  return updateProduct(id, { imageUrl: null });
}

export async function deleteProduct(id: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to delete product", { cause: error });
  if (!data) throw new AppError(404, "Product not found");
}
