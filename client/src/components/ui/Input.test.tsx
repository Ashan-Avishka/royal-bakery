import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Input } from "./Input";

it("keeps shared inputs readable and touch-friendly on mobile", () => {
  render(<Input label="Email" name="email" />);

  expect(screen.getByLabelText("Email")).toHaveClass(
    "min-h-11",
    "text-base",
    "sm:text-sm"
  );
});
