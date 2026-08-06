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
    expect(link).toHaveClass("inline-flex", "min-h-11", "items-center");
  }
});
