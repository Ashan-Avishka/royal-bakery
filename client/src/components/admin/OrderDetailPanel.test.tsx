// client/src/components/admin/OrderDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/orders";
import { OrderDetailPanel } from "./OrderDetailPanel";

vi.mock("@/app/actions/admin/orders", () => ({
  updateOrderStatus: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

const order: Order = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 1500,
  deliveryAddress: "123 Galle Road",
  createdAt: "2026-08-01T10:00:00.000Z",
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
  ],
};

describe("OrderDetailPanel (admin)", () => {
  it("shows order items, total, fulfillment, and the status update form", () => {
    render(<OrderDetailPanel order={order} />);

    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
    expect(screen.getAllByText("LKR 1,500")[0]).toBeVisible();
    expect(screen.getByText(/Delivery — 123 Galle Road/)).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Update status" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Save status/ })).toBeVisible();
  });

  it("shows Pickup when there's no delivery address", () => {
    render(<OrderDetailPanel order={{ ...order, deliveryAddress: null }} />);
    expect(screen.getByText("Pickup")).toBeVisible();
  });

  it("wraps a long delivery address", () => {
    const deliveryAddress = "No123GalleRoadColombo".repeat(12);
    render(<OrderDetailPanel order={{ ...order, deliveryAddress }} />);

    const fulfillment = screen.getByText("Fulfillment").nextElementSibling;
    expect(fulfillment).toHaveTextContent(deliveryAddress);
    expect(fulfillment).toHaveClass("break-words");
  });
});
