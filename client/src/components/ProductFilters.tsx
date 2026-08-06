"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/lib/catalog";

export function ProductFilters({
  categories,
  activeCategoryId,
  activeSearch,
  resultCount,
}: {
  categories: Category[];
  activeCategoryId?: string;
  activeSearch?: string;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchRef.current) searchRef.current.value = "";
    updateParams({ search: undefined });
  }

  const hasActiveFilters = Boolean(activeCategoryId || activeSearch);
  const resultLabel = `${resultCount} ${resultCount === 1 ? "product" : "products"}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Product categories">
          <button
            type="button"
            aria-pressed={!activeCategoryId}
            onClick={() => updateParams({ categoryId: undefined })}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 ${
              !activeCategoryId
                ? "border-caramel bg-caramel text-cream-alt"
                : "border-border-warm bg-cream-alt text-cocoa hover:border-caramel"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={activeCategoryId === category.id}
              onClick={() => updateParams({ categoryId: category.id })}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 ${
                activeCategoryId === category.id
                  ? "border-caramel bg-caramel text-cream-alt"
                  : "border-border-warm bg-cream-alt text-cocoa hover:border-caramel"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex w-full items-end gap-2 lg:w-80">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-text-muted"
            />
            <Input
              id="product-search"
              key={activeSearch ?? ""}
              ref={searchRef}
              label="Search products"
              type="search"
              defaultValue={activeSearch}
              placeholder="Search products"
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full pl-9"
            />
          </div>
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-warm bg-cream-alt text-cocoa transition-colors hover:bg-honey-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
            aria-label="Clear search"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p aria-live="polite" className="text-text-muted">
          {resultLabel}
        </p>
        {hasActiveFilters && (
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-cocoa underline decoration-border-warm underline-offset-4 transition-colors hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
          >
            Browse all products
          </Link>
        )}
      </div>
    </div>
  );
}
