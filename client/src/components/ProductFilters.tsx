"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import type { Category } from "@/lib/catalog";

type SearchAction = { value: string };

interface SubmittedNavigation {
  id: number;
  search: string;
  categoryId?: string;
  url: string;
}

function searchReducer(_: string, action: SearchAction) {
  return action.value;
}

function createNavigation(
  pathname: string,
  currentQuery: string,
  next: Record<string, string | undefined>
) {
  const params = new URLSearchParams(currentQuery);
  Object.entries(next).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  const query = params.toString();

  return {
    url: query ? `${pathname}?${query}` : pathname,
    search: params.get("search") ?? "",
    categoryId: params.get("categoryId") ?? undefined,
  };
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
  resultCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCategoryRef = useRef(activeCategoryId);
  const unresolvedNavigationsRef = useRef<SubmittedNavigation[]>([]);
  const latestIntentRef = useRef<SubmittedNavigation | null>(null);
  const correctionUrlRef = useRef<string | null>(null);
  const historyTraversalRef = useRef(false);
  const nextNavigationIdRef = useRef(0);
  const previousRouteRef = useRef({
    search: activeSearch ?? "",
    categoryId: activeCategoryId,
  });
  const [searchValue, dispatchSearch] = useReducer(searchReducer, activeSearch ?? "");

  useEffect(() => {
    const markHistoryTraversal = () => {
      historyTraversalRef.current = true;
    };

    window.addEventListener("popstate", markHistoryTraversal);
    return () => window.removeEventListener("popstate", markHistoryTraversal);
  }, []);

  useEffect(() => {
    const route = { search: activeSearch ?? "", categoryId: activeCategoryId };
    const previousRoute = previousRouteRef.current;
    if (
      route.search === previousRoute.search &&
      route.categoryId === previousRoute.categoryId
    ) {
      return;
    }

    previousRouteRef.current = route;
    latestCategoryRef.current = route.categoryId;

    if (historyTraversalRef.current) {
      historyTraversalRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      unresolvedNavigationsRef.current = [];
      latestIntentRef.current = null;
      correctionUrlRef.current = null;
      dispatchSearch({ value: route.search });
      return;
    }

    const acknowledgedIndex = unresolvedNavigationsRef.current.findIndex(
      (navigation) =>
        navigation.search === route.search && navigation.categoryId === route.categoryId
    );

    if (acknowledgedIndex !== -1) {
      const acknowledged = unresolvedNavigationsRef.current[acknowledgedIndex]!;
      unresolvedNavigationsRef.current.splice(acknowledgedIndex, 1);
      const latestIntent = latestIntentRef.current;
      if (latestIntent && acknowledged.id < latestIntent.id) {
        correctionUrlRef.current = latestIntent.url;
        latestCategoryRef.current = latestIntent.categoryId;
        router.push(latestIntent.url);
      }
      return;
    }

    if (
      correctionUrlRef.current ===
      createNavigation(pathname, searchParams.toString(), route).url
    ) {
      correctionUrlRef.current = null;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    unresolvedNavigationsRef.current = [];
    latestIntentRef.current = null;
    correctionUrlRef.current = null;
    dispatchSearch({ value: route.search });
  }, [activeCategoryId, activeSearch, pathname, router, searchParams]);

  function buildNavigation(next: Record<string, string | undefined>) {
    return createNavigation(pathname, searchParams.toString(), next);
  }

  function submitNavigation(navigation: Omit<SubmittedNavigation, "id">) {
    const intent = { ...navigation, id: ++nextNavigationIdRef.current };
    unresolvedNavigationsRef.current.push(intent);
    latestIntentRef.current = intent;
    router.push(intent.url);
  }

  function selectCategory(categoryId?: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    latestCategoryRef.current = categoryId;
    submitNavigation(buildNavigation({
      categoryId,
      search: searchValue || undefined,
    }));
  }

  function handleSearchChange(value: string) {
    dispatchSearch({ value });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const navigation = buildNavigation({
        categoryId: latestCategoryRef.current,
        search: value || undefined,
      });
      submitNavigation(navigation);
    }, 350);
  }

  function cancelPendingSearch() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
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
            value={searchValue}
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
      {resultCount !== undefined && (
        <p className="mt-3 text-sm text-text-muted" aria-live="polite">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </p>
      )}
    </section>
  );
}
