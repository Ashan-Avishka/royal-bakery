"use client";

import { useActionState } from "react";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "@/app/actions/admin/products";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category, Product } from "@/lib/catalog";

const initialState: ProductFormState = { error: null, success: false };

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const isEdit = Boolean(product);
  const action = isEdit
    ? updateProduct.bind(null, product!.id)
    : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <Input
        label="Name"
        name="name"
        required
        defaultValue={product?.name ?? ""}
        disabled={pending}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-cocoa">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          disabled={pending}
          className="min-h-24 rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-base text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel disabled:opacity-60 sm:text-sm"
        />
      </div>
      <Input
        label="Price (LKR)"
        name="price"
        type="number"
        min={0}
        step="0.01"
        required
        defaultValue={product?.price ?? ""}
        disabled={pending}
      />
      <Input
        label="Stock quantity"
        name="stockQuantity"
        type="number"
        min={0}
        step={1}
        required
        defaultValue={product?.stockQuantity ?? 0}
        disabled={pending}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-cocoa">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={product?.categoryId ?? ""}
          disabled={pending}
          className="min-h-11 rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-base text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel disabled:opacity-60 sm:text-sm"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {!c.isActive ? " (inactive)" : ""}
            </option>
          ))}
        </select>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm text-cocoa">
        <input
          type="checkbox"
          name="isAvailable"
          defaultChecked={product?.isAvailable ?? true}
          disabled={pending}
          className="size-4 rounded border-border-warm text-caramel focus:ring-caramel"
        />
        Available for purchase
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className="text-sm font-medium text-cocoa">
          {isEdit ? "Replace image" : "Product image"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          disabled={pending}
          className="min-h-11 text-base text-text-muted file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-honey-light file:px-4 file:py-2 file:text-sm file:font-medium file:text-cocoa sm:text-sm"
        />
        {product?.imageUrl && (
          <p className="text-xs text-text-muted">
            Current image is set. Upload a new file to replace it.
          </p>
        )}
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-sm text-emerald-700">Product saved.</p>
      )}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
