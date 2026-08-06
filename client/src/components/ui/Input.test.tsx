import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Input } from "./Input";

it("applies the 44px minimum-height utility to shared inputs", () => {
  render(<Input aria-label="Email address" />);

  expect(screen.getByRole("textbox", { name: "Email address" })).toHaveClass("min-h-11");
});
