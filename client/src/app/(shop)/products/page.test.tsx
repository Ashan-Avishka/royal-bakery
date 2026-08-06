import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, Product } from "@/lib/catalog";
import ProductsPage from "./page";

const catalogMocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
}));

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  ...catalogMocks,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const categories: Category[] = [
  {
    id: "cakes",
    name: "Cakes",
    description: null,
    isActive: true,
    createdAt: "2026-08-06T00:00:00.000Z",
  },
];

const products: Product[] = [
  {
    id: "cake-1",
    categoryId: "cakes",
    name: "Chocolate Celebration Cake",
    description: "A rich chocolate cake.",
    price: 3250,
    imageUrl: null,
    stockQuantity: 4,
    isAvailable: true,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
  },
  {
    id: "cake-2",
    categoryId: "cakes",
    name: "Vanilla Celebration Cake",
    description: "A vanilla cake.",
    price: 3000,
    imageUrl: null,
    stockQuantity: 2,
    isAvailable: true,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
  },
];

beforeEach(() => {
  catalogMocks.listCategories.mockResolvedValue(categories);
  catalogMocks.listProducts.mockResolvedValue(products);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductsPage", () => {
  it("preserves URL filters and presents results below a sticky filter region", async () => {
    render(
      await ProductsPage({
        searchParams: Promise.resolve({ categoryId: "cakes", search: "cake" }),
      })
    );

    expect(catalogMocks.listProducts).toHaveBeenCalledWith({
      categoryId: "cakes",
      search: "cake",
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Our bakery menu" })
    ).toBeVisible();
    expect(screen.getByText("2 products")).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search products" }).closest("section"))
      .toHaveClass("lg:sticky", "bg-cream");
    expect(screen.getAllByRole("link", { name: /celebration cake/i })).toHaveLength(2);
  });

  it("offers a clear recovery path when active filters have no matches", async () => {
    catalogMocks.listProducts.mockResolvedValue([]);

    render(
      await ProductsPage({
        searchParams: Promise.resolve({ categoryId: "cakes", search: "mango" }),
      })
    );

    expect(screen.getByRole("heading", { name: "No products found" })).toBeVisible();
    expect(
      screen.getByText(
        "No products match this search and category. Clear the filters to browse the full menu."
      )
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/products"
    );
  });

  it("offers a useful home route when the complete menu is empty", async () => {
    catalogMocks.listProducts.mockResolvedValue([]);

    render(
      await ProductsPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(
      screen.getByRole("heading", { name: "The menu is currently unavailable" })
    ).toBeVisible();
    expect(
      screen.getByText("There are no products available in the menu right now.")
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("lets catalog API failures reach the route error boundary", async () => {
    catalogMocks.listProducts.mockRejectedValue(new Error("Catalog unavailable"));

    await expect(
      ProductsPage({ searchParams: Promise.resolve({ search: "cake" }) })
    ).rejects.toThrow("Catalog unavailable");
  });
});
