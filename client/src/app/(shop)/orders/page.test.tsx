import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Order, OrderSummary } from "@/lib/orders";
import OrdersPage from "./page";

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/orders")>()),
  listOrders: mocks.listOrders,
  getOrder: mocks.getOrder,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser, getSession: mocks.getSession },
  })),
}));

vi.mock("@/app/actions/payments", () => ({ initiatePaymentAction: vi.fn() }));

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
  mocks.getUser.mockResolvedValue({ data: { user: { id: "customer-1" } } });
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: "token" } },
  });
  mocks.listOrders.mockResolvedValue([orderSummary]);
  mocks.getOrder.mockResolvedValue(orderDetail);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OrdersPage", () => {
  it("shows a placeholder when no order is selected", async () => {
    render(await OrdersPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Select an order to see its details.")).toBeVisible();
  });

  it("shows the order's details in the panel when selected", async () => {
    render(
      await OrdersPage({ searchParams: Promise.resolve({ selected: "order-1" }) })
    );

    expect(mocks.getOrder).toHaveBeenCalledWith("token", "order-1");
    expect(screen.getByRole("heading", { name: "Order details" })).toBeVisible();
    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
  });

  it("shows a not-found message for a stale selected id", async () => {
    mocks.getOrder.mockResolvedValue(null);
    render(
      await OrdersPage({ searchParams: Promise.resolve({ selected: "missing" }) })
    );
    expect(screen.getByText("This order could not be found.")).toBeVisible();
  });

  it("carries the selected id on row links", async () => {
    render(await OrdersPage({ searchParams: Promise.resolve({}) }));

    const rowLinks = screen.getAllByRole("link");
    const orderRow = rowLinks.find((link) =>
      link.getAttribute("href")?.includes("selected=order-1")
    );
    expect(orderRow).toHaveAttribute("href", "/orders?selected=order-1");
    expect(orderRow).toHaveClass("flex-col", "sm:flex-row");
    expect(orderRow?.firstElementChild).toHaveClass("min-w-0", "break-words");
  });
});
