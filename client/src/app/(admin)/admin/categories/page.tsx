import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { listAdminCategories } from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";

export default async function AdminCategoriesPage() {
  const session = await requireAdminSession();
  const categories = await listAdminCategories(session.accessToken);

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-cocoa">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="inline-flex min-h-11 items-center rounded-full bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-caramel-hover"
        >
          Add category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-text-muted">No categories yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/admin/categories/${category.id}`}
                className="flex min-w-0 flex-col gap-3 py-4 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="break-words font-medium text-cocoa">{category.name}</p>
                  {category.description && (
                    <p className="break-words text-sm text-text-muted">
                      {category.description}
                    </p>
                  )}
                </div>
                <Badge tone={category.isActive ? "success" : "muted"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
