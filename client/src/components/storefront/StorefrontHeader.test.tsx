import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StorefrontHeader } from "./StorefrontHeader";

afterEach(cleanup);

describe("StorefrontHeader", () => {
  it("shows the public navigation and authentication links to signed-out visitors", () => {
    render(<StorefrontHeader signedIn={false} isAdmin={false} cartItemCount={0} />);

    expect(screen.getByRole("link", { name: "Home" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Products" })).toBeVisible();
    expect(screen.getByRole("link", { name: "About" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign In" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeVisible();
  });

  it("renders the desktop sign-up call to action as a link without a nested button", () => {
    render(<StorefrontHeader signedIn={false} isAdmin={false} cartItemCount={0} />);

    expect(
      within(screen.getByRole("link", { name: "Sign Up" })).queryByRole("button")
    ).not.toBeInTheDocument();
  });

  it("shows signed-in account, order, cart, and admin navigation", () => {
    render(<StorefrontHeader signedIn isAdmin cartItemCount={3} />);

    expect(screen.getByRole("link", { name: "Admin" })).toBeVisible();
    expect(screen.getByRole("link", { name: "My Orders" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Account" })).toBeVisible();
    expect(screen.getByRole("link", { name: /cart, 3 items/i })).toBeVisible();
  });

  it("exposes the mobile menu as a disclosure and closes it after navigation", () => {
    render(<StorefrontHeader signedIn={false} isAdmin={false} cartItemCount={0} />);

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const mobileNavigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });

    const productsLink = within(mobileNavigation).getByRole("link", {
      name: "Products",
    });
    productsLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });

    fireEvent.click(productsLink);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(mobileNavigation.parentElement).toHaveAttribute("aria-hidden", "true");
    expect(mobileNavigation.parentElement).toHaveAttribute("inert");
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeInTheDocument();
  });
});
