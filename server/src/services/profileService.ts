import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Profile } from "../types/profile.js";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load profile", { cause: error });
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function updateProfile(
  id: string,
  fields: { fullName?: string; phone?: string; address?: string }
): Promise<Profile> {
  const update: Record<string, string> = {};
  if (fields.fullName !== undefined) update.full_name = fields.fullName;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.address !== undefined) update.address = fields.address;

  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "PGRST116") {
      throw new AppError(404, "Profile not found");
    }
    throw new AppError(500, "Failed to update profile", { cause: error });
  }
  return mapProfile(data as ProfileRow);
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list profiles", { cause: error });
  return (data as ProfileRow[]).map(mapProfile);
}

export async function setUserRole(
  id: string,
  role: "customer" | "admin"
): Promise<Profile> {
  const admin = getSupabaseAdmin();

  const { data: userData, error: getUserError } =
    await admin.auth.admin.getUserById(id);
  if (!userData?.user) {
    throw new AppError(404, `No user found with id "${id}"`);
  }
  if (getUserError) {
    throw new AppError(500, "Failed to look up user", { cause: getUserError });
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    app_metadata: { ...userData.user.app_metadata, role },
  });
  if (authError) {
    throw new AppError(500, "Failed to update user role", { cause: authError });
  }

  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new AppError(
      500,
      `Auth role updated to "${role}" but the profiles row update failed: ${error.message}. The profile is now out of sync with app_metadata — retry the role update.`,
      { cause: error }
    );
  }
  return mapProfile(data as ProfileRow);
}
