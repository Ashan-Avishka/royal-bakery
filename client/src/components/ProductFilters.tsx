"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import type { Category } from "@/lib/catalog";

export function ProductFilters({
  categories,
  activeCategoryId,
  activeSearch,
}: {
  categories: Category[];
  activeCategoryId?: string;
  activeSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || undefined });
    }, 350);
  }

  return (
    <div className="flex flex-col gap-5 border-y border-border-warm/80 bg-cream-alt/60 px-1 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParams({ categoryId: undefined })}
          className={`rounded-full border px-4 py-2 text-[12px] font-medium tracking-wide transition-all duration-300 ${
            !activeCategoryId
              ? "border-caramel bg-caramel text-cream-alt shadow-sm"
              : "border-border-warm bg-cream-alt text-cocoa hover:border-caramel hover:text-caramel"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => updateParams({ categoryId: category.id })}
            className={`rounded-full border px-4 py-2 text-[12px] font-medium tracking-wide transition-all duration-300 ${
              activeCategoryId === category.id
                ? "border-caramel bg-caramel text-cream-alt shadow-sm"
                : "border-border-warm bg-cream-alt text-cocoa hover:border-caramel hover:text-caramel"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <input
        type="search"
        defaultValue={activeSearch}
        placeholder="Search the menu…"
        onChange={(event) => handleSearchChange(event.target.value)}
        className="w-full rounded-full border border-border-warm bg-cream-alt px-4 py-2.5 text-sm text-cocoa placeholder:text-text-muted transition-colors focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30 sm:w-72"
      />
    </div>
  );
}
