import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ProductNotFound from "./not-found";

it("offers a clear recovery path for a missing product", () => {
  render(<ProductNotFound />);

  expect(screen.getByRole("heading", { name: "Product not found" })).toBeVisible();
  expect(
    screen.getByText("This product may no longer be available or the link may be incorrect.")
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "Back to all products" })).toHaveAttribute(
    "href",
    "/products"
  );
});
