import { render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { expect, it, vi } from "vitest";
import { BrandLogo } from "./BrandLogo";

vi.mock("next/image", () => ({
  default: ({ preload, ...props }: ComponentProps<"img"> & { preload?: boolean }) =>
    createElement("img", { ...props, "data-preload": preload ? "true" : undefined }),
}));

it("translates the public priority prop into the current Image preload prop", () => {
  render(<BrandLogo priority />);

  expect(screen.getByRole("img", { name: "Royal Bakery" })).toHaveAttribute(
    "data-preload",
    "true"
  );
});
