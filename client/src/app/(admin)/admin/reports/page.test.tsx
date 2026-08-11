import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsSummary } from "@/lib/admin/analytics";
import AdminReportsPage from "./page";

const mocks = vi.hoisted(() => ({
  getAdminAnalytics: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/analytics", () => ({
  getAdminAnalytics: mocks.getAdminAnalytics,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

const analytics: AnalyticsSummary = {
  from: "2026-08-01",
  to: "2026-08-31",
  totalRevenue: 0,
  paidOrdersCount: 0,
  averageOrderValue: 0,
  totalOrdersCount: 0,
  ordersByStatus: { pending: 0, processing: 0, completed: 0, cancelled: 0 },
  topProducts: [],
  categorySales: [],
  topCategory: null,
  lowStockCount: 0,
  orders: [],
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.getAdminAnalytics.mockResolvedValue(analytics);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminReportsPage", () => {
  it("wraps an unbroken top category value inside the mobile metric card", async () => {
    const topCategory = "CelebrationCakes".repeat(16);
    mocks.getAdminAnalytics.mockResolvedValue({ ...analytics, topCategory });

    render(await AdminReportsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(topCategory)).toHaveClass("min-w-0", "break-words");
  });
});
