"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  updateAdminCustomerRole,
  type UserRole,
} from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/session";

export interface UpdateCustomerRoleState {
  error: string | null;
  success: boolean;
}

const ALLOWED_ROLES: UserRole[] = ["customer", "admin"];

export async function updateCustomerRole(
  customerId: string,
  _prevState: UpdateCustomerRoleState,
  formData: FormData
): Promise<UpdateCustomerRoleState> {
  const session = await requireAdminSession();
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!ALLOWED_ROLES.includes(role)) {
    return { error: "Invalid role.", success: false };
  }

  try {
    await updateAdminCustomerRole(session.accessToken, customerId, role);
  } catch (err) {
    return {
      error:
        err instanceof ApiError ? err.message : "Failed to update customer role.",
      success: false,
    };
  }

  revalidatePath("/admin/customers");
  return { error: null, success: true };
}
