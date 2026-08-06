import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StorefrontHeader } from "./StorefrontHeader";

afterEach(cleanup);

describe("StorefrontHeader", () => {
  it("shows the public navigation and authentication links to signed-out visitors", () => {
    render(<StorefrontHeader signedIn={false} isAdmin={false} cartItemCount={0} />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "hover:text-caramel-hover"
    );
    expect(screen.getByRole("link", { name: "Products" })).toBeVisible();
    expect(screen.getByRole("link", { name: "About" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign In" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeVisible();
  });

  it("renders the desktop sign-up call to action as a link without a nested button", () => {
    render(<StorefrontHeader signedIn={false} isAdmin={false} cartItemCount={0} />);

    const signUpLink = screen.getByRole("link", { name: "Sign Up" });
    expect(within(signUpLink).queryByRole("button")).not.toBeInTheDocument();
    expect(signUpLink).toHaveClass(
      "bg-cocoa",
      "text-cream-alt",
      "hover:bg-cocoa-dark"
    );
  });

  it("shows signed-in account, order, cart, and admin navigation", () => {
    render(<StorefrontHeader signedIn isAdmin cartItemCount={3} />);

    const adminLink = screen.getByRole("link", { name: "Admin" });
    expect(adminLink).toBeVisible();
    expect(adminLink).toHaveClass("min-h-11", "text-caramel-hover", "hover:text-cocoa");
    expect(adminLink).not.toHaveClass("text-cocoa", "hover:text-caramel-hover");
    expect(screen.getByRole("link", { name: "My Orders" })).toHaveClass("min-h-11");
    expect(screen.getByRole("link", { name: "Account" })).toHaveClass(
      "min-h-11",
      "min-w-11"
    );
    expect(screen.getByRole("link", { name: /cart, 3 items/i })).toBeVisible();
    expect(screen.getByText("3")).toHaveClass("bg-cocoa", "text-cream-alt");
  });

  it("keeps the mobile disclosure active through tablet widths", () => {
    render(<StorefrontHeader signedIn isAdmin cartItemCount={3} />);

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toHaveClass(
      "hidden",
      "lg:flex"
    );
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveClass(
      "lg:hidden"
    );

    for (const link of within(
      screen.getByRole("navigation", { name: "Primary navigation" })
    ).getAllByRole("link")) {
      expect(link).toHaveClass("min-h-11", "px-3");
    }
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
