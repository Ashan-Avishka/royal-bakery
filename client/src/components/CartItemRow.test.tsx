import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { CartItem } from "@/lib/cart";
import { CartItemRow } from "./CartItemRow";

const cartActionMocks = vi.hoisted(() => ({
  removeCartItem: vi
    .fn<(formData: FormData) => Promise<void>>()
    .mockResolvedValue(undefined),
  updateCartItemQuantity: vi
    .fn<(formData: FormData) => Promise<void>>()
    .mockResolvedValue(undefined),
}));

vi.mock("@/app/actions/cart", () => cartActionMocks);

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: ComponentProps<"img"> & { fill?: boolean }) => {
    void fill;
    return createElement("img", props);
  },
}));

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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("links the product and preserves labelled quantity bounds and line total", () => {
  render(<CartItemRow item={item} />);

  const productHref = "/products/cake-1";
  expect(screen.getByRole("link", { name: "View Chocolate Celebration Cake" }))
    .toHaveAttribute("href", productHref);
  expect(screen.getByRole("link", { name: "Chocolate Celebration Cake" }))
    .toHaveAttribute("href", productHref);

  const quantityInput = screen.getByRole("spinbutton", {
    name: "Quantity for Chocolate Celebration Cake",
  });
  expect(quantityInput).toHaveAttribute("min", "1");
  expect(quantityInput).toHaveAttribute("max", "4");
  expect(quantityInput).toHaveClass("border-text-muted");
  expect(screen.getByText("LKR 5,000")).toBeVisible();
  expect(screen.getByRole("button", { name: "Update" })).toHaveClass("w-full", "sm:w-28");
  expect(screen.getByRole("button", { name: "Remove" })).toHaveClass("w-full", "sm:w-28");
});

it("submits the update and remove forms through their cart server actions", async () => {
  render(<CartItemRow item={item} />);

  fireEvent.click(screen.getByRole("button", { name: "Update" }));
  await waitFor(() => {
    expect(cartActionMocks.updateCartItemQuantity).toHaveBeenCalledTimes(1);
  });
  const updateData = cartActionMocks.updateCartItemQuantity.mock.calls[0][0];
  expect(updateData).toBeInstanceOf(FormData);
  expect(updateData.get("productId")).toBe("cake-1");
  expect(updateData.get("quantity")).toBe("2");

  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  await waitFor(() => {
    expect(cartActionMocks.removeCartItem).toHaveBeenCalledTimes(1);
  });
  const removeData = cartActionMocks.removeCartItem.mock.calls[0][0];
  expect(removeData).toBeInstanceOf(FormData);
  expect(removeData.get("productId")).toBe("cake-1");
});

it("renders a supplied mutation error as a row-local alert", () => {
  render(<CartItemRow item={item} error="Only four cakes remain." />);

  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("Only four cakes remain.");
  expect(alert.closest("article")).not.toBeNull();
});

it("stacks cart controls beneath a wrapping product identity on narrow screens", () => {
  const { container } = render(<CartItemRow item={item} />);

  expect(container.querySelector("article")).toHaveClass(
    "grid-cols-[5rem_minmax(0,1fr)]",
    "sm:grid-cols-[5rem_minmax(0,1fr)_auto]"
  );
  expect(screen.getByRole("link", { name: "Chocolate Celebration Cake" })).toHaveClass(
    "min-w-0",
    "break-words"
  );
  expect(screen.getByRole("spinbutton", { name: /quantity for chocolate/i })).toHaveClass(
    "text-base",
    "sm:text-sm"
  );
  const controls = screen.getByRole("spinbutton", { name: /quantity for chocolate/i })
    .closest("div");
  expect(controls).toHaveClass("col-span-2", "sm:col-span-1", "flex-wrap");
  expect(screen.getByText("LKR 5,000").parentElement).toBe(controls);
  expect(screen.getByRole("button", { name: "Remove" }).closest("form")?.parentElement)
    .toBe(controls);
});
