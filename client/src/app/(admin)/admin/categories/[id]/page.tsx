import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCategory } from "@/app/actions/admin/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { listAdminCategories } from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminSession();
  const categories = await listAdminCategories(session.accessToken);
  const category = categories.find((c) => c.id === id);

  if (!category) {
    notFound();
  }

  const remove = deleteCategory.bind(null, category.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
      <Link
        href="/admin/categories"
        className="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-caramel-hover hover:text-cocoa"
      >
        ← Categories
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-cocoa">Edit category</h1>
        <DeleteButton
          label="Delete"
          confirmMessage={`Delete category “${category.name}”? Products in this category will be uncategorized.`}
          action={remove}
        />
      </div>
      <CategoryForm category={category} />
    </div>
  );
}
