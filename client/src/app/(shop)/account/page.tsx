import { redirect } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

interface MeResponse { id: string; email: string | null; fullName: string | null; phone: string | null; address: string | null; role: "customer" | "admin"; }

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: { session } } = await supabase.auth.getSession();
  const profile = await api<MeResponse>("/api/users/me", { headers: { Authorization: `Bearer ${session?.access_token}` } });
  return <section className="relative overflow-x-hidden"><div className="pointer-events-none absolute -right-16 top-16 h-64 w-64 rounded-full bg-honey/25 blur-3xl" aria-hidden /><div className="page-container page-section relative min-w-0 max-w-2xl"><PageHeader eyebrow="Profile" title="Your account" description="Keep your details up to date for smoother checkout and delivery." /><div className="surface-pad min-w-0 rounded-[1.5rem] border border-border-warm/80 bg-cream-alt shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)]"><AccountForm profile={profile} /></div></div></section>;
}
