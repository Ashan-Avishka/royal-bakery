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
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CartPage mutation errors", () => {
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
