import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { requireAdminSession } from "@/lib/admin/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <aside className="border-b border-border-warm bg-cream-alt lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-6 px-4 py-5 lg:sticky lg:top-0 lg:min-h-screen">
          <div>
            <Link
              href="/admin"
              className="font-display text-lg font-semibold text-cocoa"
            >
              Royal Bakery
            </Link>
            <p className="mt-0.5 text-xs text-text-muted">Admin</p>
          </div>

          <AdminNav />

          <div className="mt-auto flex flex-col gap-2 border-t border-border-warm pt-4">
            <p className="truncate text-xs text-text-muted">{session.email}</p>
            <Link
              href="/"
              className="text-sm font-medium text-cocoa transition-colors hover:text-caramel"
            >
              View storefront
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="px-0 py-1">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
