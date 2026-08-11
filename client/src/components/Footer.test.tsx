import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Footer } from "./Footer";

it("keeps footer link hover text on the accessible dark caramel token", () => {
  render(<Footer />);

  const links = screen.getAllByRole("link");
  expect(screen.getByRole("link", { name: "Our bakery" })).toHaveClass(
    "hover:text-caramel-hover"
  );
  for (const link of links) {
    expect(link).toHaveClass("inline-flex", "min-h-11", "min-w-11", "items-center", "px-3");
  }
});

it("uses contrast-safe text for its small labels and factual service copy", () => {
  render(<Footer />);
  expect(screen.getAllByText("Explore").at(-1)).toHaveClass("text-caramel-hover");
  expect(screen.getAllByText("Visit").at(-1)).toHaveClass("text-caramel-hover");
  expect(screen.getAllByText(/Menu and online ordering for Royal Bakery/i).at(-1)).toBeVisible();
});
