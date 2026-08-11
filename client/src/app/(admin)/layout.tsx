import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminSession } from "@/lib/admin/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-cream lg:flex">
      <aside className="hidden w-56 shrink-0 border-r border-border-warm bg-cream-alt lg:block">
        <div className="sticky top-0 flex min-h-screen flex-col p-4">
          <AdminNav mode="desktop" email={session.email} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 border-b border-border-warm bg-cream-alt lg:hidden">
          <AdminNav mode="mobile" email={session.email} />
        </div>
        {children}
      </div>
    </div>
  );
}
