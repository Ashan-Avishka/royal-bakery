import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Footer } from "./Footer";

it("keeps footer link hover text on the accessible dark caramel token", () => {
  render(<Footer />);

  expect(screen.getByRole("link", { name: "Our bakery" })).toHaveClass(
    "hover:text-caramel-hover"
  );
});
