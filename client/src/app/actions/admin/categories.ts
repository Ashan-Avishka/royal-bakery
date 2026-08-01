"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
} from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";

export interface CategoryFormState {
  error: string | null;
  success: boolean;
}

function revalidateCategories(categoryId?: string) {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  if (categoryId) revalidatePath(`/admin/categories/${categoryId}`);
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const session = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Name is required.", success: false };
  }

  let categoryId: string;
  try {
    const category = await createAdminCategory(session.accessToken, {
      name,
      ...(description ? { description } : {}),
    });
    categoryId = category.id;
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Failed to create category.",
      success: false,
    };
  }

  revalidateCategories(categoryId);
  redirect(`/admin/categories/${categoryId}`);
}

export async function updateCategory(
  categoryId: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const session = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return { error: "Name is required.", success: false };
  }

  try {
    await updateAdminCategory(session.accessToken, categoryId, {
      name,
      description: description || undefined,
      isActive,
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Failed to update category.",
      success: false,
    };
  }

  revalidateCategories(categoryId);
  return { error: null, success: true };
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const session = await requireAdminSession();
  try {
    await deleteAdminCategory(session.accessToken, categoryId);
  } catch (err) {
    throw err instanceof ApiError
      ? err
      : new Error("Failed to delete category.");
  }
  revalidateCategories();
  redirect("/admin/categories");
}
