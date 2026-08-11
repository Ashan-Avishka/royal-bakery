import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductCard } from "./ProductCard";

vi.mock("next/image", () => ({
  default: ({ priority, fill, alt, ...props }: ComponentProps<"img"> & {
    priority?: boolean;
    fill?: boolean;
  }) => {
    void fill;

    return createElement("img", {
      ...props,
      alt: alt ?? "",
      "data-priority": priority ? "true" : undefined,
    });
  },
}));

const product = {
  id: "baked-001",
  categoryId: "cakes",
  name: "Chocolate Celebration Cake",
  description: "A rich chocolate cake.",
  price: 3250,
  imageUrl: "https://images.example.com/cake.jpg",
  stockQuantity: 4,
  isAvailable: true,
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
};

afterEach(cleanup);

it("renders the product image, formatted price, and a full-card product link", () => {
  render(<ProductCard product={product} />);

  expect(
    screen.getByRole("img", { name: "Chocolate Celebration Cake" })
  ).toHaveAttribute("src", product.imageUrl);
  expect(screen.getByText("LKR 3,250")).toHaveClass("text-caramel-hover");
  expect(
    screen.getByRole("link", { name: /chocolate celebration cake/i })
  ).toHaveAttribute("href", "/products/baked-001");
});

it("renders a Royal Bakery fallback when the product has no image", () => {
  render(<ProductCard product={{ ...product, imageUrl: null }} />);

  expect(screen.getByText(/royal bakery/i)).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("shows an out-of-stock badge for unavailable inventory", () => {
  render(<ProductCard product={{ ...product, stockQuantity: 0 }} />);

  expect(screen.getByText("Out of stock")).toBeVisible();
});

it("forwards priority and an accurate responsive size hint to the product image", () => {
  render(<ProductCard product={product} priority />);

  expect(screen.getByRole("img")).toHaveAttribute("data-priority", "true");
  expect(screen.getByRole("img")).toHaveAttribute(
    "sizes",
    "(min-width: 1280px) 264px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 2rem)"
  );
});

it("keeps wishlist and purchase actions visible with touch-sized controls", () => {
  render(<ProductCard product={product} />);

  expect(screen.getByRole("button", { name: "Add to wishlist" })).toHaveClass(
    "h-11",
    "w-11"
  );
  expect(screen.getByRole("button", { name: "Add to cart" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Details" })).toBeVisible();
});
