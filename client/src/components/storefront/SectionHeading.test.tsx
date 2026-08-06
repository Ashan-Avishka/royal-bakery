import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

it("uses the accessible dark caramel token for its small eyebrow text", () => {
  render(<SectionHeading eyebrow="Our story" title="About the bakery" />);

  expect(screen.getByText("Our story")).toHaveClass("text-caramel-hover");
});
