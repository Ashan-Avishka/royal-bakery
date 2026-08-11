import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cart } from "@/lib/cart";
import CheckoutPage from "./page";

const mocks = vi.hoisted(() => ({
  getCart: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/components/CheckoutForm", () => ({
  CheckoutForm: () => (
    <form aria-label="Fulfilment details">
      <button type="submit">Place order</button>
    </form>
  ),
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
  ],
  subtotal: 5000,
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

describe("CheckoutPage", () => {
  it("redirects signed-out visitors before loading their cart", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(CheckoutPage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mocks.getCart).not.toHaveBeenCalled();
  });

  it("redirects an authenticated visitor with an empty cart", async () => {
    mocks.getCart.mockResolvedValue({ items: [], subtotal: 0 });

    await expect(CheckoutPage()).rejects.toThrow("NEXT_REDIRECT:/cart");
  });

  it("keeps the fulfilment form before the cart summary in keyboard source order", async () => {
    render(await CheckoutPage());

    const form = screen.getByRole("form", { name: "Fulfilment details" });
    const editCart = screen.getByRole("link", { name: "Edit cart" });

    expect(screen.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
    expect(editCart).toHaveAttribute("href", "/cart");
    expect(form.compareDocumentPosition(editCart)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(form.compareDocumentPosition(screen.getByRole("heading", { name: "Order summary" }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
