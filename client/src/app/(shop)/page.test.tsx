import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, Product } from "@/lib/catalog";
import HomePage from "./page";

const catalogMocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
}));

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  ...catalogMocks,
}));

vi.mock("next/image", () => ({
  default: (imageProps: ComponentProps<"img"> & { preload?: boolean; fill?: boolean }) => {
    const { preload, fill, ...props } = imageProps;
    void fill;

    return createElement("img", {
      ...props,
      "data-preload": preload ? "true" : undefined,
    });
  },
}));

const categories: Category[] = [
  {
    id: "cakes",
    name: "Cakes",
    description: null,
    isActive: true,
    createdAt: "2026-08-06T00:00:00.000Z",
  },
  {
    id: "bread",
    name: "Bread",
    description: null,
    isActive: true,
    createdAt: "2026-08-06T00:00:00.000Z",
  },
];

const products: Product[] = Array.from({ length: 5 }, (_, index) => ({
  id: `product-${index + 1}`,
  categoryId: index % 2 === 0 ? "cakes" : "bread",
  name: `Bakery favourite ${index + 1}`,
  description: "A Royal Bakery menu item.",
  price: 1200 + index * 100,
  imageUrl: index === 0 ? null : `https://bakery.supabase.co/storage/v1/object/public/products/${index + 1}.jpg`,
  stockQuantity: 4,
  isAvailable: true,
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
}));

beforeEach(() => {
  catalogMocks.listCategories.mockResolvedValue(categories);
  catalogMocks.listProducts.mockResolvedValue(products);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HomePage", () => {
  it("leads with the current Royal Bakery offer and its measured LCP image", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Baked before sunrise. Ready when you are.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Handcrafted cakes, pastries, and bread — ordered online, finished fresh for pickup or delivery in Harispaththuwa."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore the menu" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.getByRole("link", { name: "Our story" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(
      screen.getByRole("img", { name: "Fresh pastries and baked goods on a bakery counter" })
    ).toHaveAttribute("data-preload", "true");
  });

  it("uses existing accessible color tokens for the current hero and section actions", async () => {
    render(await HomePage());

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-cream");
    expect(screen.getByRole("link", { name: "Explore the menu" })).toHaveClass(
      "bg-cocoa",
      "text-cream-alt",
      "hover:bg-cocoa-dark"
    );
    expect(screen.getByRole("link", { name: "View full menu" })).toHaveClass(
      "text-caramel-hover",
      "hover:text-cocoa"
    );
  });

  it("composes category, featured-product, and story discovery in visual order", async () => {
    render(await HomePage());

    const shopLink = screen.getByRole("link", { name: "Explore the menu" });
    const categoryLink = screen.getAllByRole("link", { name: /cakes/i })[0]!;
    const firstProductLink = screen.getAllByRole("link", { name: /bakery favourite 1/i })[0]!;

    expect(categoryLink).toHaveAttribute(
      "href",
      "/products?categoryId=cakes"
    );
    expect(screen.getByRole("heading", { name: "Shop by craving" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Featured selections" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "A bakery menu for everyday orders and celebrations.",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read our story" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(shopLink.compareDocumentPosition(categoryLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(categoryLink.compareDocumentPosition(firstProductLink)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("keeps featured product images lazy unless one is measured as LCP", async () => {
    render(await HomePage());

    const featuredHeading = screen.getByRole("heading", { name: "Featured selections" });
    const featuredSection = featuredHeading.closest("section");
    expect(featuredSection).not.toBeNull();

    const productImages = within(featuredSection as HTMLElement)
      .getAllByRole("img")
      .filter((image) => image.tagName === "IMG");
    expect(productImages).toHaveLength(2);
    expect(productImages.every((image) => image.dataset.preload !== "true")).toBe(true);
    expect(
      productImages.every(
        (image) =>
          image
            .getAttribute("sizes")
            ?.includes("(min-width: 1024px) calc((100vw - 6rem) / 3)")
      )
    ).toBe(true);
  });

  it("keeps discovery available and explains empty product rails without catalog data", async () => {
    catalogMocks.listCategories.mockResolvedValue([]);
    catalogMocks.listProducts.mockResolvedValue([]);

    render(await HomePage());

    expect(screen.getByRole("heading", { name: "Shop by craving" })).toBeInTheDocument();
    expect(screen.getAllByText("No products are available right now — check back soon.")).toHaveLength(
      3
    );
    expect(screen.getByRole("img", { name: "Fresh pastries and baked goods on a bakery counter" })).toBeVisible();
  });
});
