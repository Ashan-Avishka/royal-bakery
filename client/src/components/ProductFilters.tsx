"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import type { Category } from "@/lib/catalog";

interface SearchState {
  activeSearch: string;
  draft: string;
  submittedSearches: string[];
}

type SearchAction =
  | { type: "draft"; value: string }
  | { type: "submitted"; value: string }
  | { type: "sync"; value: string };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  if (action.type === "draft") {
    return { ...state, draft: action.value };
  }

  if (action.type === "submitted") {
    return { ...state, submittedSearches: [...state.submittedSearches, action.value] };
  }

  if (action.value === state.activeSearch) return state;

  const acknowledgementIndex = state.submittedSearches.indexOf(action.value);
  if (acknowledgementIndex !== -1) {
    return {
      ...state,
      activeSearch: action.value,
      submittedSearches: state.submittedSearches.filter((_, index) => index !== acknowledgementIndex),
    };
  }

  return { activeSearch: action.value, draft: action.value, submittedSearches: [] };
}

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
  const latestCategoryRef = useRef(activeCategoryId);
  const [searchState, dispatchSearch] = useReducer(searchReducer, activeSearch ?? "", (value) => ({
    activeSearch: value,
    draft: value,
    submittedSearches: [],
  }));

  useEffect(() => {
    latestCategoryRef.current = activeCategoryId;
  }, [activeCategoryId]);

  useEffect(() => {
    dispatchSearch({ type: "sync", value: activeSearch ?? "" });
  }, [activeSearch]);

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function selectCategory(categoryId?: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    latestCategoryRef.current = categoryId;
    updateParams({
      categoryId,
      search: searchState.draft || undefined,
    });
  }

  function handleSearchChange(value: string) {
    dispatchSearch({ type: "draft", value });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatchSearch({ type: "submitted", value });
      updateParams({
        categoryId: latestCategoryRef.current,
        search: value || undefined,
      });
    }, 350);
  }

  function cancelPendingSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  const filtersActive = Boolean(activeCategoryId || activeSearch);

  return (
    <section className="bg-cream lg:sticky lg:top-4 lg:z-10 lg:py-3">
      <div className="flex min-w-0 flex-col gap-5 border-y border-border-warm/80 bg-cream-alt/60 px-1 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => selectCategory()}
            aria-pressed={!activeCategoryId}
            className={`min-h-11 w-full rounded-full border px-4 py-2 text-[12px] font-medium tracking-wide transition-all duration-300 sm:w-auto ${
              !activeCategoryId
                ? "border-caramel bg-cocoa text-cream-alt shadow-sm"
                : "border-border-warm bg-cream-alt text-cocoa hover:border-caramel hover:text-caramel-hover"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category.id)}
              aria-pressed={activeCategoryId === category.id}
              className={`min-h-11 w-full rounded-full border px-4 py-2 text-[12px] font-medium tracking-wide transition-all duration-300 sm:w-auto ${
                activeCategoryId === category.id
                  ? "border-caramel bg-cocoa text-cream-alt shadow-sm"
                  : "border-border-warm bg-cream-alt text-cocoa hover:border-caramel hover:text-caramel-hover"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:items-end">
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={searchState.draft}
            placeholder="Search the menu..."
            onChange={(event) => handleSearchChange(event.target.value)}
            className="min-h-11 w-full rounded-full border border-border-warm bg-cream-alt px-4 py-2.5 text-base text-cocoa placeholder:text-text-muted transition-colors focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30 sm:w-72 sm:text-sm"
          />
          {filtersActive && (
            <Link
              href="/products"
              onClick={cancelPendingSearch}
              className="min-h-11 w-full py-2 text-center text-sm font-medium text-caramel-hover transition-colors hover:text-cocoa sm:w-auto sm:text-right"
            >
              Browse all products
            </Link>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-text-muted" aria-live="polite">
        {resultCount} {resultCount === 1 ? "product" : "products"}
      </p>
    </section>
  );
}
