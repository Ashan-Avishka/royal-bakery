import { redirect } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

interface MeResponse {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const profile = await api<MeResponse>("/api/users/me", {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-cocoa">Your account</h1>
      <AccountForm profile={profile} />
    </div>
  );
}
