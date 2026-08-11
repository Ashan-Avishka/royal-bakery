import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { listAdminCategories } from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";

export default async function NewProductPage() {
  const session = await requireAdminSession();
  const categories = await listAdminCategories(session.accessToken);

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
      <Link
        href="/admin/products"
        className="mb-6 inline-block text-sm font-medium text-caramel hover:text-caramel-hover"
      >
        ← Products
      </Link>
      <h1 className="mb-8 font-display text-3xl text-cocoa">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
