import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cart } from "@/lib/cart";
import CartPage from "./page";

const mocks = vi.hoisted(() => ({
  getCart: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/cart")>()),
  getCart: mocks.getCart,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getSession: mocks.getSession,
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

const cart: Cart = {
  items: [
    {
      productId: "cake-1",
      name: "Chocolate Celebration Cake",
      price: 2500,
      imageUrl: null,
      quantity: 2,
      subtotal: 5000,
      stockQuantity: 4,
      isAvailable: true,
    },
    {
      productId: "tart-1",
      name: "Honey Tart",
      price: 1800,
      imageUrl: null,
      quantity: 1,
      subtotal: 1800,
      stockQuantity: 6,
      isAvailable: true,
    },
  ],
  subtotal: 6800,
};

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: "access-token" } },
  });
  mocks.getCart.mockResolvedValue(cart);
  mocks.redirect.mockImplementation((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CartPage", () => {
  it("redirects unauthenticated visitors before loading the cart", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(
      CartPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mocks.getCart).not.toHaveBeenCalled();
  });

  it("renders the empty cart recovery state without an order summary", async () => {
    mocks.getCart.mockResolvedValue({ items: [], subtotal: 0 });

    render(await CartPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Browse the menu" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.queryByRole("button", { name: "Browse the menu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Order summary" }))
      .not.toBeInTheDocument();
  });

  it("composes populated items with an accessible checkout action", async () => {
    render(await CartPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Cart items" })).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Order summary" })).toBeVisible();
    expect(screen.getByText("Chocolate Celebration Cake x 2")).toBeVisible();
    expect(screen.getByRole("link", { name: "Proceed to checkout" }))
      .toHaveAttribute("href", "/checkout");
    expect(screen.getByRole("link", { name: "Proceed to checkout" })).toHaveClass(
      "bg-cocoa",
      "hover:bg-cocoa-dark"
    );
  });

  it("renders an error beside the matching product row", async () => {
    render(
      await CartPage({
        searchParams: Promise.resolve({
          error: "Only four cakes remain.",
          errorProductId: "cake-1",
        }),
      })
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Only four cakes remain.");
    expect(alert.closest("article")).not.toBeNull();
  });

  it("keeps an error at page level when its product ID is unmatched", async () => {
    render(
      await CartPage({
        searchParams: Promise.resolve({
          error: "That cart item is no longer available.",
          errorProductId: "missing-product",
        }),
      })
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("That cart item is no longer available.");
    expect(alert.closest("article")).toBeNull();
  });
});
