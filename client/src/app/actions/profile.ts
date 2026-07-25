"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionState {
  error: string | null;
  success: boolean;
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in.", success: false };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const fields: Record<string, string> = {};
  if (fullName) fields.fullName = fullName;
  if (phone) fields.phone = phone;
  if (address) fields.address = address;

  if (Object.keys(fields).length === 0) {
    return { error: "Nothing to update.", success: false };
  }

  try {
    await api("/api/users/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(fields),
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update profile.",
      success: false,
    };
  }

  revalidatePath("/account");
  return { error: null, success: true };
}
