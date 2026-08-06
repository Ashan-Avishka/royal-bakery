import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { CartItem } from "@/lib/cart";
import { CartItemRow } from "./CartItemRow";

const item: CartItem = {
  productId: "cake-1",
  name: "Chocolate Celebration Cake",
  price: 2500,
  imageUrl: "https://images.example.com/cake.jpg",
  quantity: 2,
  subtotal: 5000,
  stockQuantity: 4,
  isAvailable: true,
};

afterEach(cleanup);

it("links the product and preserves labelled quantity bounds and line total", () => {
  render(<CartItemRow item={item} />);

  expect(
    screen.getByRole("link", { name: "Chocolate Celebration Cake" })
  ).toHaveAttribute("href", "/products/cake-1");
  expect(
    screen.getByRole("spinbutton", {
      name: "Quantity for Chocolate Celebration Cake",
    })
  ).toHaveAttribute("min", "1");
  expect(
    screen.getByRole("spinbutton", {
      name: "Quantity for Chocolate Celebration Cake",
    })
  ).toHaveAttribute("max", "4");
  expect(screen.getByText("LKR 5,000")).toBeVisible();
  expect(screen.getByRole("button", { name: "Update" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Remove" })).toBeVisible();
});

it("renders a supplied mutation error as a row-local alert", () => {
  render(<CartItemRow item={item} error="Only four cakes remain." />);

  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("Only four cakes remain.");
  expect(alert.closest("article")).not.toBeNull();
});
