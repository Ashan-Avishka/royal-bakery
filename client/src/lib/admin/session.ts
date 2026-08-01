import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
  accessToken: string;
  userId: string;
  email: string | undefined;
}

/**
 * Ensures the current user is signed in and has the admin role.
 * Uses getSession() (cookie/JWT read) instead of getUser() (Auth API
 * round-trip) — the Express API re-validates the JWT on every call.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role =
    (session.user.app_metadata?.role as string | undefined) ?? "customer";
  if (role !== "admin") {
    redirect("/");
  }

  return {
    accessToken: session.access_token,
    userId: session.user.id,
    email: session.user.email,
  };
}
