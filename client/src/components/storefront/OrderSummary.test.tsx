import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { CartItem } from "@/lib/cart";
import { OrderSummary } from "./OrderSummary";

const items: CartItem[] = [
  {
    productId: "cake-1",
    name: "Chocolate Cake",
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
];

afterEach(cleanup);

it("renders an accessible order summary with item and subtotal rows", () => {
  render(<OrderSummary items={items} subtotal={6800} />);

  expect(screen.getByRole("heading", { name: "Order summary" })).toBeVisible();
  expect(screen.getByText("Chocolate Cake x 2")).toBeVisible();
  expect(screen.getByText("LKR 5,000")).toBeVisible();
  expect(screen.getByText("Honey Tart x 1")).toBeVisible();
  expect(screen.getByText("LKR 1,800")).toBeVisible();
  expect(screen.getByText("LKR 6,800")).toBeVisible();
});

it("renders the optional edit link and checkout action", () => {
  render(
    <OrderSummary
      items={items}
      subtotal={6800}
      editHref="/cart"
      action={<a href="/checkout">Proceed to checkout</a>}
    />
  );

  expect(screen.getByRole("link", { name: "Edit cart" })).toHaveAttribute(
    "href",
    "/cart"
  );
  expect(screen.getByRole("link", { name: "Proceed to checkout" })).toHaveAttribute(
    "href",
    "/checkout"
  );
});
