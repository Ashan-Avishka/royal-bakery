import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "./CheckoutForm";

const mocks = vi.hoisted(() => ({
  placeOrder: vi.fn(),
}));

vi.mock("@/app/actions/orders", () => ({
  placeOrder: mocks.placeOrder,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mocks.placeOrder.mockResolvedValue({ error: null });
});

describe("CheckoutForm", () => {
  it("keeps delivery labelling and pickup guidance available before submission", () => {
    render(<CheckoutForm />);

    const address = screen.getByRole("textbox", { name: /delivery address/i });

    expect(screen.getByRole("heading", { name: "Fulfilment details" })).toBeVisible();
    expect(address).toHaveAttribute("name", "deliveryAddress");
    expect(address).not.toBeRequired();
    expect(
      screen.getByText("Leave blank for pickup from our bakery.")
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  });

  it("prevents duplicate submission with a stable pending action", async () => {
    let resolveOrder: ((state: { error: string | null }) => void) | undefined;
    mocks.placeOrder.mockImplementation(
      () => new Promise((resolve) => {
        resolveOrder = resolve;
      })
    );

    render(<CheckoutForm />);

    const form = screen.getByRole("form", { name: "Fulfilment details" });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(form).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("button", { name: "Placing order..." })).toBeDisabled();
    });

    await act(async () => {
      resolveOrder?.({ error: null });
    });

    await waitFor(() => {
      expect(form).toHaveAttribute("aria-busy", "false");
      expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
    });
  });

  it("announces a server error beside the fulfilment controls", async () => {
    mocks.placeOrder.mockResolvedValue({ error: "Unable to place this order." });

    render(<CheckoutForm />);

    fireEvent.submit(screen.getByRole("form", { name: "Fulfilment details" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to place this order.");
    expect(alert.closest("form")).not.toBeNull();
  });
});
