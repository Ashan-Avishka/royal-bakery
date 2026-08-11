import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

it("wraps long titles and stacks its action container on mobile", () => {
  render(
    <PageHeader
      title="A very long administrative order title that must remain readable on narrow screens"
      action={{ href: "/admin/orders", label: "View all orders" }}
    />
  );

  expect(screen.getByRole("heading", { level: 1 })).toHaveClass("break-words");
  expect(screen.getByRole("link", { name: "View all orders" }).parentElement).toHaveClass(
    "flex",
    "w-full",
    "sm:w-auto"
  );
});
