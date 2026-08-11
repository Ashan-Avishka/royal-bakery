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

it("disables its action-arrow motion for reduced-motion users", () => {
  render(
    <PageHeader
      title="Orders"
      action={{ href: "/admin/orders", label: "Review order history" }}
    />
  );

  expect(screen.getByRole("link", { name: "Review order history" }).querySelector("span")).toHaveClass(
    "motion-reduce:transition-none",
    "motion-reduce:group-hover:translate-x-0"
  );
});

it("uses a contrast-safe caramel token for small eyebrow and action text", () => {
  render(<PageHeader eyebrow="Orders" title="Orders" action={{ href: "/orders", label: "View orders" }} />);
  expect(screen.getByText("Orders", { selector: "p" })).toHaveClass("text-caramel-hover");
  expect(screen.getByRole("link", { name: "View orders" })).toHaveClass("text-caramel-hover");
});
