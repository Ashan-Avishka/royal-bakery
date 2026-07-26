import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  setCartItemQuantity,
} from "./cartService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const PRODUCT_A = "22222222-2222-2222-2222-222222222222";
const PRODUCT_B = "33333333-3333-3333-3333-333333333333";
const PRODUCT_C = "44444444-4444-4444-4444-444444444444";

function seed() {
  return createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    products: [
      {
        id: PRODUCT_A,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
      {
        id: PRODUCT_B,
        category_id: null,
        name: "Sold Out Bread",
        description: null,
        price: "300.00",
        image_url: null,
        stock_quantity: 0,
        is_available: false,
        created_at: "t",
        updated_at: "t",
      },
      {
        id: PRODUCT_C,
        category_id: null,
        name: "Cinnamon Roll",
        description: null,
        price: "420.00",
        image_url: null,
        stock_quantity: 10,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
    ],
    cartItems: [
      { id: "c1", user_id: USER_ID, product_id: PRODUCT_A, quantity: 2, created_at: "t" },
      { id: "c2", user_id: OTHER_USER_ID, product_id: PRODUCT_A, quantity: 9, created_at: "t" },
    ],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
});

describe("getCart", () => {
  it("returns only the given user's items with a computed subtotal", async () => {
    const cart = await getCart(USER_ID);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe("Croissant");
    expect(cart.items[0].subtotal).toBe(760);
    expect(cart.subtotal).toBe(760);
  });

  it("returns an empty cart for a user with no items", async () => {
    const cart = await getCart("no-such-user");
    expect(cart).toEqual({ items: [], subtotal: 0 });
  });
});

describe("addToCart", () => {
  it("adds a new item for a user with no existing cart item for that product", async () => {
    const cart = await addToCart("brand-new-user", PRODUCT_A, 1);
    expect(cart.items.find((i) => i.productId === PRODUCT_A)?.quantity).toBe(1);
  });

  it("increases quantity if already in the cart", async () => {
    const cart = await addToCart(USER_ID, PRODUCT_A, 1);
    expect(cart.items[0].quantity).toBe(3);
  });

  it("throws a 404 AppError for an unknown product", async () => {
    await expect(addToCart(USER_ID, "no-such-product", 1)).rejects.toMatchObject({ status: 404 });
  });

  it("throws a 404 AppError for an unavailable product", async () => {
    await expect(addToCart(USER_ID, PRODUCT_B, 1)).rejects.toMatchObject({ status: 404 });
  });

  it("throws a 409 AppError when the requested quantity exceeds stock", async () => {
    await expect(addToCart(USER_ID, PRODUCT_A, 10)).rejects.toMatchObject({ status: 409 });
  });
});

describe("setCartItemQuantity", () => {
  it("sets the exact quantity", async () => {
    const cart = await setCartItemQuantity(USER_ID, PRODUCT_A, 5);
    expect(cart.items[0].quantity).toBe(5);
  });

  it("throws a 409 AppError when the quantity exceeds stock", async () => {
    await expect(setCartItemQuantity(USER_ID, PRODUCT_A, 99)).rejects.toMatchObject({ status: 409 });
  });

  it("throws a 404 AppError when the item isn't in the cart", async () => {
    await expect(setCartItemQuantity(USER_ID, PRODUCT_C, 1)).rejects.toMatchObject({ status: 404 });
  });
});

describe("removeCartItem / clearCart", () => {
  it("removes a single item", async () => {
    const cart = await removeCartItem(USER_ID, PRODUCT_A);
    expect(cart.items).toHaveLength(0);
  });

  it("clears the whole cart", async () => {
    await expect(clearCart(USER_ID)).resolves.toBeUndefined();
    const cart = await getCart(USER_ID);
    expect(cart.items).toHaveLength(0);
  });
});
