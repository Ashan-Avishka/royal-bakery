import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductFilters } from "./ProductFilters";

const push = vi.fn();
const replace = vi.fn();
const navigationState = vi.hoisted(() => ({ query: "categoryId=cakes&search=chocolate" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(navigationState.query),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
  replace.mockClear();
  navigationState.query = "categoryId=cakes&search=chocolate";
  vi.useRealTimers();
});

const categories = [
  {
    id: "cakes",
    name: "Cakes",
    description: null,
    isActive: true,
    createdAt: "2026-08-06T00:00:00.000Z",
  },
  {
    id: "cookies",
    name: "Cookies",
    description: null,
    isActive: true,
    createdAt: "2026-08-06T00:00:00.000Z",
  },
];

it("exposes the selected category with aria-pressed and a polite result summary", () => {
  render(
    <ProductFilters
      categories={categories}
      activeCategoryId="cakes"
      activeSearch="chocolate"
      resultCount={2}
    />
  );

  expect(screen.getByRole("button", { name: "Cakes" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(screen.getByRole("button", { name: "Cakes" })).toHaveClass(
    "bg-cocoa",
    "text-cream-alt"
  );
  expect(screen.getByText("2 products")).toHaveAttribute("aria-live", "polite");
});

it("labels search and debounces query updates while preserving categoryId", () => {
  vi.useFakeTimers();
  render(
    <ProductFilters
      categories={categories}
      activeCategoryId="cakes"
      resultCount={1}
    />
  );

  fireEvent.change(screen.getByRole("searchbox", { name: /search products/i }), {
    target: { value: "vanilla" },
  });
  vi.advanceTimersByTime(349);
  expect(push).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1);
  expect(push).toHaveBeenCalledWith("/products?categoryId=cakes&search=vanilla");
});

it("applies the latest typed search when selecting another category before the debounce", () => {
  vi.useFakeTimers();
  render(
    <ProductFilters
      categories={categories}
      activeCategoryId="cakes"
      activeSearch="chocolate"
      resultCount={1}
    />
  );

  fireEvent.change(screen.getByRole("searchbox", { name: /search products/i }), {
    target: { value: "vanilla" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cookies" }));

  expect(push).toHaveBeenLastCalledWith(
    "/products?categoryId=cookies&search=vanilla"
  );
  vi.advanceTimersByTime(350);
  expect(push).toHaveBeenCalledTimes(1);
});

it("keeps a newly selected category when search changes before navigation commits", () => {
  vi.useFakeTimers();
  render(
    <ProductFilters
      categories={categories}
      activeCategoryId="cakes"
      activeSearch="chocolate"
      resultCount={1}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Cookies" }));
  fireEvent.change(screen.getByRole("searchbox", { name: /search products/i }), {
    target: { value: "vanilla" },
  });
  vi.advanceTimersByTime(350);

  expect(push).toHaveBeenNthCalledWith(
    1,
    "/products?categoryId=cookies&search=chocolate"
  );
  expect(push).toHaveBeenNthCalledWith(
    2,
    "/products?categoryId=cookies&search=vanilla"
  );
});

it("cancels a pending search when activating the reset link", () => {
  vi.useFakeTimers();
  render(
    <ProductFilters
      categories={categories}
      activeCategoryId="cakes"
      activeSearch="chocolate"
      resultCount={1}
    />
  );

  fireEvent.change(screen.getByRole("searchbox", { name: /search products/i }), {
    target: { value: "vanilla" },
  });
  const resetLink = screen.getByRole("link", { name: /browse all products/i });
  resetLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
  fireEvent.click(resetLink);

  vi.advanceTimersByTime(350);
  expect(push).not.toHaveBeenCalled();
});

it("provides a reset control when filters are active", () => {
  render(
    <ProductFilters
      categories={categories}
      activeCategoryId="cakes"
      activeSearch="chocolate"
      resultCount={1}
    />
  );

  expect(screen.getByRole("link", { name: /browse all products/i })).toHaveAttribute(
    "href",
    "/products"
  );
  expect(screen.getByRole("link", { name: /browse all products/i })).toHaveClass(
    "text-caramel-hover",
    "hover:text-cocoa"
  );
});

it("uses full-width, touch-friendly controls before the small breakpoint", () => {
  render(<ProductFilters categories={categories} resultCount={2} />);

  expect(screen.getByRole("button", { name: "All" })).toHaveClass(
    "w-full",
    "min-h-11",
    "sm:w-auto"
  );
  expect(screen.getByRole("searchbox", { name: /search products/i })).toHaveClass(
    "w-full",
    "text-base",
    "sm:text-sm"
  );
});

it("resyncs cleared query props so a later search cannot restore stale filters", () => {
  vi.useFakeTimers();
  const { rerender } = render(
    <ProductFilters categories={categories} activeCategoryId="cakes" activeSearch="chocolate" resultCount={1} />
  );

  navigationState.query = "";
  rerender(<ProductFilters categories={categories} resultCount={2} />);
  const searchbox = screen.getByRole("searchbox", { name: /search products/i });
  expect(searchbox).toHaveValue("");

  fireEvent.change(searchbox, {
    target: { value: "vanilla" },
  });
  vi.advanceTimersByTime(350);

  expect(push).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith("/products?search=vanilla");
});

it("keeps every category control touch-sized on narrow screens", () => {
  render(<ProductFilters categories={categories} resultCount={2} />);

  expect(screen.getByRole("button", { name: "Cakes" })).toHaveClass(
    "min-h-11",
    "w-full",
    "sm:w-auto"
  );
});
