import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Order, OrderSummary } from "@/lib/orders";
import AdminOrdersPage from "./page";

const mocks = vi.hoisted(() => ({
  listAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/orders", () => ({
  listAdminOrders: mocks.listAdminOrders,
  getAdminOrder: mocks.getAdminOrder,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("@/app/actions/admin/orders", () => ({
  updateOrderStatus: vi.fn(),
}));

const orderSummary: OrderSummary = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 1500,
  deliveryAddress: null,
  createdAt: "2026-08-01T10:00:00.000Z",
};

const orderDetail: Order = {
  ...orderSummary,
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
  ],
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.listAdminOrders.mockResolvedValue([orderSummary]);
  mocks.getAdminOrder.mockResolvedValue(orderDetail);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminOrdersPage", () => {
  it("shows a placeholder when no order is selected", async () => {
    render(await AdminOrdersPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Select an order to see its details.")).toBeVisible();
    expect(mocks.getAdminOrder).not.toHaveBeenCalled();
  });

  it("shows the order's details in the panel when selected", async () => {
    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ selected: "order-1" }),
      })
    );

    expect(mocks.getAdminOrder).toHaveBeenCalledWith("token", "order-1");
    expect(screen.getByRole("heading", { name: "Order details" })).toBeVisible();
    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
  });

  it("shows a not-found message for a stale selected id", async () => {
    mocks.getAdminOrder.mockResolvedValue(null);

    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ selected: "missing" }),
      })
    );

    expect(screen.getByText("This order could not be found.")).toBeVisible();
  });

  it("carries the selected id and preserves the status filter on row links", async () => {
    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ status: "pending" }),
      })
    );

    expect(mocks.listAdminOrders).toHaveBeenCalledWith("token", { status: "pending" });
    const rowLinks = screen.getAllByRole("link");
    const orderRow = rowLinks.find((link) =>
      link.getAttribute("href")?.includes("selected=order-1")
    );
    expect(orderRow).toHaveAttribute(
      "href",
      "/admin/orders?status=pending&selected=order-1"
    );
  });
});
