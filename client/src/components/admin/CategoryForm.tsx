"use client";

import { useActionState } from "react";
import {
  createCategory,
  updateCategory,
  type CategoryFormState,
} from "@/app/actions/admin/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/lib/catalog";

const initialState: CategoryFormState = { error: null, success: false };

export function CategoryForm({ category }: { category?: Category }) {
  const isEdit = Boolean(category);
  const action = isEdit
    ? updateCategory.bind(null, category!.id)
    : createCategory;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <Input
        label="Name"
        name="name"
        required
        defaultValue={category?.name ?? ""}
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
          defaultValue={category?.description ?? ""}
          disabled={pending}
          className="min-h-24 rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-base text-cocoa placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-caramel disabled:opacity-60 sm:text-sm"
        />
      </div>
      {isEdit && (
      <label className="flex min-h-11 items-center gap-2 text-sm text-cocoa">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={category?.isActive ?? true}
            disabled={pending}
            className="size-4 rounded border-border-warm text-caramel focus:ring-caramel"
          />
          Active (shown on storefront)
        </label>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-sm text-emerald-700">Category saved.</p>
      )}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}
