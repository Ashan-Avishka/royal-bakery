// client/src/components/admin/CustomerDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AdminCustomer } from "@/lib/admin/customers";
import { CustomerDetailPanel } from "./CustomerDetailPanel";

afterEach(() => {
  cleanup();
});

const customer: AdminCustomer = {
  id: "cust-1",
  fullName: "Jane Doe",
  phone: "0771234567",
  address: "123 Galle Road",
  role: "customer",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("CustomerDetailPanel", () => {
  it("shows the customer's profile fields", () => {
    render(<CustomerDetailPanel customer={customer} isSelf={false} />);

    expect(screen.getByText("Jane Doe")).toBeVisible();
    expect(screen.getByText("customer")).toBeVisible();
    expect(screen.getByText("0771234567")).toBeVisible();
    expect(screen.getByText("123 Galle Road")).toBeVisible();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("flags the signed-in admin's own row and falls back for a missing name", () => {
    render(
      <CustomerDetailPanel
        customer={{ ...customer, fullName: null, role: "admin" }}
        isSelf
      />
    );

    expect(screen.getByText("Unnamed user")).toBeVisible();
    expect(screen.getByText("You")).toBeVisible();
  });

  it("wraps long customer names and contact values", () => {
    const fullName = "RoyalBakeryAdministrator".repeat(12);
    const address = "GalleRoadColombo".repeat(16);
    render(
      <CustomerDetailPanel customer={{ ...customer, fullName, address }} isSelf={false} />
    );

    expect(screen.getByText(fullName)).toHaveClass("break-words");
    expect(screen.getByText(address)).toHaveClass("break-words");
  });
});
