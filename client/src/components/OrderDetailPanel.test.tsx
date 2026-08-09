// client/src/components/OrderDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/orders";
import { OrderDetailPanel } from "./OrderDetailPanel";

vi.mock("@/app/actions/payments", () => ({ initiatePaymentAction: vi.fn() }));

afterEach(() => {
  cleanup();
});

const order: Order = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 2000,
  deliveryAddress: "123 Galle Road",
  createdAt: "2026-08-01T10:00:00.000Z",
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
    { productId: "p2", name: "Croissant", quantity: 1, unitPrice: 500, subtotal: 500 },
  ],
};

describe("OrderDetailPanel (shop)", () => {
  it("shows order items, total, fulfillment, and a Pay now button when unpaid", () => {
    render(<OrderDetailPanel order={order} />);

    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
    expect(screen.getByText("LKR 1,500")).toBeVisible();
    expect(screen.getByText(/Delivery — 123 Galle Road/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Pay now" })).toBeVisible();
  });

  it("hides the Pay now button once the order is paid", () => {
    render(<OrderDetailPanel order={{ ...order, paymentStatus: "paid" }} />);
    expect(screen.queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
  });

  it("hides the Pay now button for a cancelled order", () => {
    render(<OrderDetailPanel order={{ ...order, status: "cancelled" }} />);
    expect(screen.queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
  });
});
