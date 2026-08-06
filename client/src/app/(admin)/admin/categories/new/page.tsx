import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdminSession } from "@/lib/admin/session";

export default async function NewCategoryPage() {
  await requireAdminSession();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/admin/categories"
        className="mb-6 inline-block text-sm font-medium text-caramel hover:text-caramel-hover"
      >
        ← Categories
      </Link>
      <h1 className="mb-8 font-display text-3xl text-cocoa">New category</h1>
      <CategoryForm />
    </div>
  );
}
