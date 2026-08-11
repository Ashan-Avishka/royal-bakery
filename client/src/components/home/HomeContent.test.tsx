import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AboutTeaser } from "./AboutTeaser";
import { HowItWorks } from "./HowItWorks";
import { NewsletterCta } from "./NewsletterCta";

afterEach(cleanup);

it("uses touch-sized styled links instead of nested interactive controls", () => {
  render(<><AboutTeaser /><NewsletterCta /></>);
  for (const name of ["Read our story", "Shop the full menu"]) {
    const link = screen.getByRole("link", { name });
    expect(link).toHaveClass("min-h-11");
    expect(link.querySelector("button")).toBeNull();
  }
});

it("uses neutral catalog and checkout copy", () => {
  render(<><AboutTeaser /><HowItWorks /><NewsletterCta /></>);
  expect(screen.getByText(/Royal Bakery is a neighbourhood bakery with a menu for everyday orders and celebrations/i)).toBeVisible();
  expect(screen.getByText(/Browse available products, including cakes, pastries, breads, and sweets/i)).toBeVisible();
  expect(screen.getByText(/Add your selection to the cart and complete checkout online/i)).toBeVisible();
  expect(screen.getByText(/Browse the current menu and place an order online/i)).toBeVisible();
});

it("uses contrast-safe small text in the sections it renders", () => {
  render(<><AboutTeaser /><HowItWorks /></>);
  expect(screen.getByText("Our craft")).toHaveClass("text-caramel-hover");
  expect(screen.getByText("Step 01")).toHaveClass("text-cocoa");
});
