import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminCustomer } from "@/lib/admin/customers";
import AdminCustomersPage from "./page";

const mocks = vi.hoisted(() => ({
  listAdminCustomers: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/customers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/customers")>()),
  listAdminCustomers: mocks.listAdminCustomers,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("@/app/actions/admin/customers", () => ({
  updateCustomerRole: vi.fn(),
}));

const customer: AdminCustomer = {
  id: "cust-1",
  fullName: "Jane Doe",
  phone: "0771234567",
  address: "123 Galle Road",
  role: "customer",
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.listAdminCustomers.mockResolvedValue([customer]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminCustomersPage", () => {
  it("shows a placeholder when no customer is selected", async () => {
    render(await AdminCustomersPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Select a customer to see their details.")).toBeVisible();
  });

  it("shows the customer's details in the panel when selected", async () => {
    render(
      await AdminCustomersPage({
        searchParams: Promise.resolve({ selected: "cust-1" }),
      })
    );

    expect(screen.getByRole("heading", { name: "Customer details" })).toBeVisible();
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0771234567").length).toBeGreaterThan(0);
  });

  it("shows a not-found message for a stale selected id", async () => {
    render(
      await AdminCustomersPage({
        searchParams: Promise.resolve({ selected: "missing" }),
      })
    );
    expect(screen.getByText("This customer could not be found.")).toBeVisible();
  });

  it("keeps the role-change control on the row, not duplicated in the panel", async () => {
    render(
      await AdminCustomersPage({
        searchParams: Promise.resolve({ selected: "cust-1" }),
      })
    );
    expect(screen.getAllByRole("button", { name: "Update" })).toHaveLength(1);
  });
});
