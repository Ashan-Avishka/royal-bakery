import { cleanup, render, screen } from "@testing-library/react";
import { type ReactElement } from "react";
import { expect, it, vi } from "vitest";
import { CategoryForm } from "./CategoryForm";
import { CustomerRoleForm } from "./CustomerRoleForm";
import { ProductForm } from "./ProductForm";
import { UpdateOrderStatusForm } from "./UpdateOrderStatusForm";

const actionState = vi.hoisted(() => ({ state: { error: "Unable to save.", success: false } }));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [actionState.state, vi.fn(), false],
}));

function expectAssociatedFeedback(component: ReactElement, message: string) {
  cleanup();
  render(component);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent(message);
  expect(alert.closest("form")).toHaveAttribute("aria-describedby", alert.id);
}

it("associates category, product, customer-role, and order-status errors with their forms", () => {
  expectAssociatedFeedback(<CategoryForm />, "Unable to save.");
  expectAssociatedFeedback(<ProductForm categories={[]} />, "Unable to save.");
  expectAssociatedFeedback(<CustomerRoleForm customerId="customer-1" currentRole="customer" isSelf={false} />, "Unable to save.");
  expectAssociatedFeedback(<UpdateOrderStatusForm orderId="order-1" currentStatus="pending" />, "Unable to save.");
});

it("announces successful updates as polite status messages", () => {
  actionState.state = { error: null, success: true };
  render(<CategoryForm />);
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Category saved.");
  expect(status.closest("form")).toHaveAttribute("aria-describedby", status.id);
});
