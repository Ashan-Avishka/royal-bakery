"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
  uploadAdminProductImage,
} from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";

export interface ProductFormState {
  error: string | null;
  success: boolean;
}

function revalidateProducts(productId?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/products");
  if (productId) {
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/products/${productId}`);
  }
}

function parseProductFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stockQuantity") ?? "").trim();
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const isAvailable = formData.get("isAvailable") === "on";

  const price = Number(priceRaw);
  const stockQuantity = stockRaw === "" ? 0 : Number(stockRaw);

  return {
    name,
    description,
    price,
    stockQuantity,
    categoryId: categoryIdRaw === "" ? null : categoryIdRaw,
    isAvailable,
  };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await requireAdminSession();
  const fields = parseProductFields(formData);

  if (!fields.name) {
    return { error: "Name is required.", success: false };
  }
  if (!Number.isFinite(fields.price) || fields.price < 0) {
    return { error: "Enter a valid price.", success: false };
  }
  if (!Number.isInteger(fields.stockQuantity) || fields.stockQuantity < 0) {
    return { error: "Stock must be a whole number ≥ 0.", success: false };
  }

  let productId: string;
  try {
    const product = await createAdminProduct(session.accessToken, {
      name: fields.name,
      price: fields.price,
      stockQuantity: fields.stockQuantity,
      isAvailable: fields.isAvailable,
      categoryId: fields.categoryId,
      ...(fields.description ? { description: fields.description } : {}),
    });
    productId = product.id;

    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      await uploadAdminProductImage(
        session.accessToken,
        product.id,
        image,
        image.name
      );
    }
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Failed to create product.",
      success: false,
    };
  }

  revalidateProducts(productId);
  redirect(`/admin/products/${productId}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await requireAdminSession();
  const fields = parseProductFields(formData);

  if (!fields.name) {
    return { error: "Name is required.", success: false };
  }
  if (!Number.isFinite(fields.price) || fields.price < 0) {
    return { error: "Enter a valid price.", success: false };
  }
  if (!Number.isInteger(fields.stockQuantity) || fields.stockQuantity < 0) {
    return { error: "Stock must be a whole number ≥ 0.", success: false };
  }

  try {
    await updateAdminProduct(session.accessToken, productId, {
      name: fields.name,
      price: fields.price,
      stockQuantity: fields.stockQuantity,
      isAvailable: fields.isAvailable,
      categoryId: fields.categoryId,
      ...(fields.description ? { description: fields.description } : {}),
    });

    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      await uploadAdminProductImage(
        session.accessToken,
        productId,
        image,
        image.name
      );
    }
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Failed to update product.",
      success: false,
    };
  }

  revalidateProducts(productId);
  return { error: null, success: true };
}

export async function deleteProduct(productId: string): Promise<void> {
  const session = await requireAdminSession();
  try {
    await deleteAdminProduct(session.accessToken, productId);
  } catch (err) {
    throw err instanceof ApiError
      ? err
      : new Error("Failed to delete product.");
  }
  revalidateProducts();
  redirect("/admin/products");
}
