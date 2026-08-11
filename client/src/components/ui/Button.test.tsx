import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "./Button";

it("uses the accessible dark primary-action token pairing", () => {
  render(<Button>Continue</Button>);

  expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
    "bg-cocoa",
    "text-cream-alt",
    "hover:bg-cocoa-dark",
    "min-h-11"
  );
});
