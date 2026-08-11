import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct } from "@/app/actions/admin/products";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { Badge } from "@/components/ui/Badge";
import {
  getAdminProduct,
  listAdminCategories,
  stockLabel,
} from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminSession();
  const [product, categories] = await Promise.all([
    getAdminProduct(session.accessToken, id),
    listAdminCategories(session.accessToken),
  ]);

  if (!product) {
    notFound();
  }

  const stock = stockLabel(product.stockQuantity);
  const remove = deleteProduct.bind(null, product.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
      <Link
        href="/admin/products"
        className="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-caramel-hover hover:text-cocoa"
      >
        ← Products
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-cocoa">Edit product</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={stock.tone}>{stock.label}</Badge>
            {!product.isAvailable && <Badge tone="muted">Unavailable</Badge>}
          </div>
        </div>
        <DeleteButton
          label="Delete"
          confirmMessage={`Delete product “${product.name}”? This cannot be undone.`}
          action={remove}
        />
      </div>

      {product.imageUrl && (
        <div className="relative mb-8 aspect-[16/9] max-w-md overflow-hidden rounded-xl bg-honey-light">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="448px"
          />
        </div>
      )}

      <ProductForm product={product} categories={categories} />
    </div>
  );
}
