import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, Product } from "@/lib/catalog";
import AdminProductsPage from "./page";

const mocks = vi.hoisted(() => ({
  listAdminProducts: vi.fn(),
  listAdminCategories: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/catalog")>()),
  listAdminProducts: mocks.listAdminProducts,
  listAdminCategories: mocks.listAdminCategories,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("next/image", () => ({
  default: (imageProps: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) => {
    const { priority, fill, ...props } = imageProps;
    void fill;
    return createElement("img", { ...props, "data-priority": priority ? "true" : undefined });
  },
}));

const category: Category = {
  id: "cakes",
  name: "Cakes",
  description: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const product: Product = {
  id: "cake-1",
  categoryId: "cakes",
  name: "Chocolate Cake",
  description: null,
  price: 1500,
  imageUrl: null,
  stockQuantity: 3,
  isAvailable: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.listAdminProducts.mockResolvedValue([product]);
  mocks.listAdminCategories.mockResolvedValue([category]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminProductsPage", () => {
  it("shows a placeholder when no product is selected", async () => {
    render(await AdminProductsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Select a product to see its details.")).toBeVisible();
  });

  it("shows the product's details, including its category, when selected", async () => {
    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ selected: "cake-1" }),
      })
    );

    expect(screen.getByRole("heading", { name: "Product details" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit product" })).toHaveAttribute(
      "href",
      "/admin/products/cake-1"
    );
    expect(screen.getAllByText("Cakes").length).toBeGreaterThan(0);
  });

  it("shows a not-found message for a stale selected id", async () => {
    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ selected: "missing" }),
      })
    );
    expect(screen.getByText("This product could not be found.")).toBeVisible();
  });

  it("carries the selected id and preserves active filters on row links", async () => {
    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ categoryId: "cakes" }),
      })
    );

    const rowLinks = screen.getAllByRole("link");
    const productRow = rowLinks.find((link) =>
      link.getAttribute("href")?.includes("selected=cake-1")
    );
    expect(productRow).toHaveAttribute(
      "href",
      "/admin/products?categoryId=cakes&selected=cake-1"
    );
  });
});
