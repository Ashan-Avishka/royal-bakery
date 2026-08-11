import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

it("uses the accessible dark caramel token for its small eyebrow text", () => {
  render(<SectionHeading eyebrow="Our story" title="About the bakery" />);

  expect(screen.getByText("Our story")).toHaveClass("text-caramel-hover");
});

it("keeps a long action within the heading layout at tablet widths", () => {
  const actionLabel = "Read the complete seasonal collection and availability details";

  render(
    <SectionHeading
      title="Seasonal favorites"
      action={<a href="/products">{actionLabel}</a>}
    />
  );

  const heading = screen.getByRole("heading", { name: "Seasonal favorites" }).parentElement;
  const actionContainer = screen.getByRole("link", { name: actionLabel }).parentElement;

  expect(heading?.parentElement).toHaveClass("sm:flex-wrap");
  expect(actionContainer).toHaveClass("min-w-0", "max-w-full", "break-anywhere");
  expect(actionContainer).not.toHaveClass("shrink-0");
});
