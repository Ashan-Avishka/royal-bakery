import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CategoryShowcase } from "./CategoryShowcase";
import { CategoryCarousel } from "./CategoryCarousel";
import { Testimonials } from "./Testimonials";

const categories = [
  { id: "cakes", name: "Cakes", description: null, isActive: true, createdAt: "2026-08-06T00:00:00.000Z" },
];

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
afterEach(cleanup);

it("uses compliant dark caramel text for small labels on cream surfaces", () => {
  render(<><CategoryShowcase categories={categories} /><CategoryCarousel categories={categories} /><Testimonials /></>);
  for (const label of screen.getAllByText("Collection", { selector: "p" }).slice(0, 3)) {
    expect(label).toHaveClass("text-caramel-hover");
  }
  const browseLabels = screen.getAllByText("Browse →").filter((label) => label.classList.contains("text-caramel-hover"));
  expect(browseLabels).toHaveLength(3);
  for (const label of browseLabels) {
    expect(label).not.toHaveClass("opacity-80");
  }
  expect(screen.getByText("Royal Bakery menu")).toHaveClass("text-caramel-hover");
  expect(screen.getAllByText("Explore").at(-1)).toHaveClass("text-caramel-hover");
});

it("uses factual menu language instead of unsupported preparation or review claims", () => {
  render(<><CategoryShowcase categories={categories} /><CategoryCarousel categories={categories} /><Testimonials /></>);
  expect(screen.getByText("Sweet and savoury buns")).toBeVisible();
  expect(screen.getByText("Browse cakes, breads, pastries, and other bakery categories.")).toBeVisible();
  expect(screen.getByText("Browse the menu to view available bakery products.")).toBeVisible();
  expect(screen.queryByText(/sourdough has ruined supermarket bread/i)).not.toBeInTheDocument();
});
