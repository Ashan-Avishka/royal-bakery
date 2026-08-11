import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductCard } from "./ProductCard";

vi.mock("next/image", () => ({
  default: ({ preload, fill, alt, ...props }: ComponentProps<"img"> & {
    preload?: boolean;
    fill?: boolean;
  }) => {
    void fill;

    return createElement("img", {
      ...props,
      alt: alt ?? "",
      "data-preload": preload ? "true" : undefined,
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

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

it("renders the product image, formatted price, and a full-card product link", () => {
  render(<ProductCard product={product} />);

  expect(
    screen.getByRole("img", { name: "Chocolate Celebration Cake" })
  ).toHaveAttribute("src", product.imageUrl);
  expect(screen.getByText("LKR 3,250")).toHaveClass("text-cocoa");
  expect(
    screen.getAllByRole("link", { name: /chocolate celebration cake/i })[0]
  ).toHaveAttribute("href", "/products/baked-001");
});

it("renders a clear fallback when the product has no image", () => {
  render(<ProductCard product={{ ...product, imageUrl: null }} />);

  expect(screen.getByText("Photo coming soon")).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("shows an out-of-stock badge for unavailable inventory", () => {
  render(<ProductCard product={{ ...product, stockQuantity: 0 }} />);

  expect(screen.getByText("Sold out")).toBeVisible();
});

it("translates the public priority prop into preload with an accurate responsive size hint", () => {
  render(<ProductCard product={product} priority />);

  expect(screen.getByRole("img")).toHaveAttribute("data-preload", "true");
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

it("uses a caller-provided image size hint for wider product rails", () => {
  render(
    <ProductCard
      product={product}
      sizes="(min-width: 1024px) 352px, calc(100vw - 2rem)"
    />
  );

  expect(screen.getByRole("img")).toHaveAttribute(
    "sizes",
    "(min-width: 1024px) 352px, calc(100vw - 2rem)"
  );
});

it("resynchronizes wishlist state when the rendered product changes", () => {
  window.localStorage.setItem("royal-bakery-wishlist", JSON.stringify(["baked-002"]));
  const { rerender } = render(<ProductCard product={product} />);

  expect(screen.getByRole("button", { name: "Add to wishlist" })).toBeVisible();

  rerender(<ProductCard product={{ ...product, id: "baked-002" }} />);

  expect(screen.getByRole("button", { name: "Remove from wishlist" })).toBeVisible();
});
