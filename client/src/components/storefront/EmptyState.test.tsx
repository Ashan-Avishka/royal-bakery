import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

it("renders a recovery link with the supplied heading and description", () => {
  render(
    <EmptyState
      title="No pastries found"
      description="Try another search or browse every product."
      actionHref="/products"
      actionLabel="Browse all products"
    />
  );

  expect(screen.getByRole("heading", { name: "No pastries found" })).toBeVisible();
  expect(screen.getByText("Try another search or browse every product.")).toBeVisible();
  expect(screen.getByRole("link", { name: /browse all products/i })).toHaveAttribute(
    "href",
    "/products"
  );
});
