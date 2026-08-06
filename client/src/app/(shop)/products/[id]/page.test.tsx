import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/catalog";
import ProductDetailPage from "./page";

const mocks = vi.hoisted(() => ({
  getProduct: vi.fn(),
  getUser: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  getProduct: mocks.getProduct,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));

vi.mock("@/app/actions/cart", () => ({ addToCart: vi.fn() }));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

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

const product: Product = {
  id: "cake-1",
  categoryId: "cakes",
  name: "Chocolate Celebration Cake",
  description: "A rich chocolate cake for sharing.",
  price: 3250,
  imageUrl: "https://images.example.com/cake.jpg",
  stockQuantity: 4,
  isAvailable: true,
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
};

beforeEach(() => {
  mocks.getProduct.mockResolvedValue(product);
  mocks.getUser.mockResolvedValue({ data: { user: { id: "customer-1" } } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductDetailPage", () => {
  it("renders stable product media, purchase controls, and truthful reassurance", async () => {
    render(
      await ProductDetailPage({
        params: Promise.resolve({ id: product.id }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByRole("img", { name: product.name }).parentElement).toHaveClass(
      "aspect-[4/5]"
    );
    expect(screen.getByRole("heading", { level: 1, name: product.name })).toBeVisible();
    expect(screen.getByText("LKR 3,250")).toHaveClass("text-cocoa");
    expect(screen.getByText("In stock")).toBeVisible();
    expect(screen.getByText(product.description as string)).toBeVisible();
    expect(screen.getByLabelText("Quantity")).toHaveAttribute("name", "quantity");
    expect(document.querySelector('input[name="productId"]')).toHaveValue(product.id);
    expect(screen.getByRole("button", { name: "Add to cart" })).toHaveClass("w-full");
    expect(screen.getByText("Current availability shown online")).toBeVisible();
    expect(screen.getByText("Order ahead through your account")).toBeVisible();
    expect(screen.getByText("Pickup or delivery selection at checkout")).toBeVisible();
  });

  it("keeps query-string errors adjacent to an actionable signed-in form", async () => {
    render(
      await ProductDetailPage({
        params: Promise.resolve({ id: product.id }),
        searchParams: Promise.resolve({ error: "Please choose a valid quantity." }),
      })
    );

    const error = screen.getByText("Please choose a valid quantity.");
    expect(error).toHaveAttribute("role", "alert");
    expect(error.compareDocumentPosition(screen.getByLabelText("Quantity"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("gives signed-out shoppers primary sign-in and catalog recovery actions", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    render(
      await ProductDetailPage({
        params: Promise.resolve({ id: product.id }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByRole("link", { name: "Sign in to add to cart" })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getByRole("link", { name: "Back to all products" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.queryByLabelText("Quantity")).not.toBeInTheDocument();
  });

  it("makes unavailable products visibly non-purchasable", async () => {
    mocks.getProduct.mockResolvedValue({ ...product, isAvailable: false });

    render(
      await ProductDetailPage({
        params: Promise.resolve({ id: product.id }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getAllByText("Out of stock")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
    expect(screen.queryByLabelText("Quantity")).not.toBeInTheDocument();
  });

  it("delegates a missing product to the route not-found boundary", async () => {
    mocks.getProduct.mockResolvedValue(null);

    await expect(
      ProductDetailPage({
        params: Promise.resolve({ id: "missing" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
