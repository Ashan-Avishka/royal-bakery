import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DetailPanel, DetailPanelPlaceholder } from "./DetailPanel";

afterEach(() => {
  cleanup();
});

describe("DetailPanel", () => {
  it("renders a title, children, and close links pointing at closeHref", () => {
    render(
      <DetailPanel title="Order details" closeHref="/admin/orders">
        <p>Order content</p>
      </DetailPanel>
    );

    expect(screen.getByRole("heading", { name: "Order details" })).toBeVisible();
    expect(screen.getByText("Order content")).toBeVisible();
    expect(screen.getByLabelText("Close details")).toHaveAttribute(
      "href",
      "/admin/orders"
    );
    expect(screen.getByRole("link", { name: "← Back to list" })).toHaveAttribute(
      "href",
      "/admin/orders"
    );
    expect(screen.getByRole("link", { name: /Back to list/ })).toHaveClass("min-h-11");
  });

  it("accepts a className override for context-specific styling", () => {
    render(
      <DetailPanel title="Order details" closeHref="/orders" className="custom-panel">
        <p>content</p>
      </DetailPanel>
    );

    expect(screen.getByText("Order details").closest("div.custom-panel")).not.toBeNull();
  });
});

describe("DetailPanelPlaceholder", () => {
  it("renders the provided message", () => {
    render(<DetailPanelPlaceholder message="Select an order to see its details." />);
    expect(screen.getByText("Select an order to see its details.")).toBeVisible();
  });
});
