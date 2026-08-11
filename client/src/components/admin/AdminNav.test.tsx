import { cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminNav } from "./AdminNav";

const pathname = vi.hoisted(() => ({ value: "/admin/orders" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  pathname.value = "/admin/orders";
});

describe("AdminNav", () => {
  it("discloses every admin destination and account action from the mobile menu", () => {
    render(<AdminNav mode="mobile" email="admin@royalbakery.lk" />);

    const trigger = screen.getByRole("button", { name: /open admin navigation/i });
    expect(screen.getByRole("link", { name: /Royal Bakery/i })).toHaveClass("min-h-11");
    expect(trigger).toHaveAttribute("aria-controls", "admin-mobile-navigation");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Orders" })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).toHaveAttribute(
      "id",
      "admin-mobile-navigation"
    );
    for (const label of [
      "Dashboard",
      "Orders",
      "Products",
      "Categories",
      "Customers",
      "Reports",
      "View storefront",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  it("marks nested routes active and closes on Escape with focus returned to the trigger", () => {
    render(<AdminNav mode="mobile" email="admin@royalbakery.lk" />);

    const trigger = screen.getByRole("button", { name: /open admin navigation/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes the mobile menu when a destination is chosen or the route changes", () => {
    const { rerender } = render(
      <AdminNav mode="mobile" email="admin@royalbakery.lk" />
    );
    const trigger = screen.getByRole("button", { name: /open admin navigation/i });
    fireEvent.click(trigger);
    const productLink = screen.getByRole("link", { name: "Products" });
    const click = createEvent.click(productLink);
    click.preventDefault();
    fireEvent(productLink, click);
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    pathname.value = "/admin/reports";
    rerender(<AdminNav mode="mobile" email="admin@royalbakery.lk" />);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the complete desktop navigation visible without a menu trigger", () => {
    pathname.value = "/admin/products/cake-1";
    render(<AdminNav mode="desktop" email="admin@royalbakery.lk" />);

    expect(screen.queryByRole("button", { name: /admin navigation/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "View storefront" })).toBeVisible();
    expect(screen.getByRole("link", { name: "View storefront" })).toHaveClass(
      "min-h-11",
      "hover:text-caramel-hover"
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
