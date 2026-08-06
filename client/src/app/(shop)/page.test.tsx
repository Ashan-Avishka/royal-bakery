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
  default: (imageProps: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) => {
    const { priority, fill, ...props } = imageProps;
    void fill;

    return createElement("img", {
      ...props,
      "data-priority": priority ? "true" : undefined,
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
  it("leads with the Royal Bakery offer and the first available product image", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Royal Bakery" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cakes, pastries, and bread made for everyday cravings and meaningful celebrations in Colombo."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop the menu" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.getByRole("link", { name: "Our story" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(
      screen.getByRole("img", { name: "Bakery favourite 2 from Royal Bakery" })
    ).toHaveAttribute("src", products[1].imageUrl);
  });

  it("uses accessible existing color tokens for small text and primary actions", async () => {
    render(await HomePage());

    expect(screen.getByText("Colombo bakery")).toHaveClass("text-cocoa");
    expect(screen.getByRole("link", { name: "Shop the menu" })).toHaveClass(
      "bg-cocoa",
      "text-cream-alt",
      "hover:bg-cocoa-dark"
    );
    expect(screen.getByRole("link", { name: "View the menu" })).toHaveClass(
      "text-caramel-hover",
      "hover:text-cocoa"
    );
    expect(screen.getByRole("link", { name: "Cakes" })).toHaveClass(
      "hover:text-caramel-hover"
    );
  });

  it("composes category, value, story, and featured-product discovery in visual order", async () => {
    render(await HomePage());

    const shopLink = screen.getByRole("link", { name: "Shop the menu" });
    const categoryLink = screen.getByRole("link", { name: "Cakes" });
    const firstProductLink = screen.getByRole("link", { name: /bakery favourite 1/i });

    expect(screen.getByRole("link", { name: "Cakes" })).toHaveAttribute(
      "href",
      "/products?categoryId=cakes"
    );
    expect(screen.getByText("Browse the menu online")).toBeInTheDocument();
    expect(screen.getByText("See current availability")).toBeInTheDocument();
    expect(screen.getByText("Order ahead")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "A bakery for the everyday and the memorable",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discover our story" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(shopLink.compareDocumentPosition(categoryLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(categoryLink.compareDocumentPosition(firstProductLink)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getAllByRole("link").at(-1)).toHaveAccessibleName("Shop all bakes");
  });

  it("prioritizes only the first row of featured product images", async () => {
    render(await HomePage());

    const featuredHeading = screen.getByRole("heading", { name: "Featured from the bakery" });
    const featuredSection = featuredHeading.closest("section");
    expect(featuredSection).not.toBeNull();

    const productImages = within(featuredSection as HTMLElement).getAllByRole("img");
    expect(productImages).toHaveLength(4);
    expect(productImages.slice(0, 3).every((image) => image.dataset.priority === "true")).toBe(
      true
    );
    expect(productImages[3]).not.toHaveAttribute("data-priority");
  });

  it("keeps section rhythm and renders an intentional empty state without catalog data", async () => {
    catalogMocks.listCategories.mockResolvedValue([]);
    catalogMocks.listProducts.mockResolvedValue([]);

    render(await HomePage());

    expect(
      screen.getByRole("heading", { name: "Find your favourite" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cakes" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The menu is unavailable right now" })).toBeVisible();
    expect(screen.getByRole("link", { name: "View the full menu" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(
      screen.queryByRole("heading", { name: "Choose something for today" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Shop all bakes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
