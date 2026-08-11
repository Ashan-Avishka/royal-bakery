import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/catalog";
import { ProductDetailPanel } from "./ProductDetailPanel";

vi.mock("next/image", () => ({
  default: (imageProps: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) => {
    const { priority, fill, ...props } = imageProps;
    void fill;
    return createElement("img", { ...props, "data-priority": priority ? "true" : undefined });
  },
}));

afterEach(() => {
  cleanup();
});

const product: Product = {
  id: "cake-1",
  categoryId: "cakes",
  name: "Chocolate Cake",
  description: "Rich and moist.",
  price: 1500,
  imageUrl: "https://images.example.com/cake.jpg",
  stockQuantity: 10,
  isAvailable: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

describe("ProductDetailPanel", () => {
  it("shows the product's details, category, and an edit link", () => {
    render(<ProductDetailPanel product={product} categoryName="Cakes" />);

    expect(screen.getByText("Chocolate Cake")).toBeVisible();
    expect(screen.getByText("LKR 1,500")).toBeVisible();
    expect(screen.getByText("Cakes")).toBeVisible();
    expect(screen.getByText("Rich and moist.")).toBeVisible();
    expect(screen.getByText("In stock")).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit product" })).toHaveAttribute(
      "href",
      "/admin/products/cake-1"
    );
    expect(screen.getByRole("link", { name: "Edit product" })).toHaveClass(
      "min-h-11",
      "bg-cocoa"
    );
  });

  it("flags unavailable products", () => {
    render(<ProductDetailPanel product={{ ...product, isAvailable: false }} />);
    expect(screen.getByText("Unavailable")).toBeVisible();
  });

  it("wraps long product and category names", () => {
    const longName = "ChocolateCake".repeat(16);
    const longCategory = "CelebrationCakes".repeat(12);
    render(
      <ProductDetailPanel
        product={{ ...product, name: longName }}
        categoryName={longCategory}
      />
    );

    expect(screen.getByText(longName)).toHaveClass("break-words");
    expect(screen.getByText(longCategory)).toHaveClass("break-words");
  });
});
