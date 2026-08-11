import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import { SiteNav } from "./SiteNav";

afterEach(() => {
  cleanup();
  pathname = "/";
});

describe("SiteNav", () => {
  it("opens and closes the mobile menu with equivalent navigation", async () => {
    render(<SiteNav isSignedIn={false} cartItemCount={0} />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    expect(trigger).toHaveAttribute("aria-controls", "site-mobile-navigation");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    });
    expect(screen.getAllByRole("link", { name: "Menu" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu when Escape is pressed", () => {
    render(<SiteNav isSignedIn={false} cartItemCount={0} />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu when the pathname changes", async () => {
    const view = render(<SiteNav isSignedIn={false} cartItemCount={0} />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });

    fireEvent.click(trigger);
    pathname = "/products";
    view.rerender(<SiteNav isSignedIn={false} cartItemCount={0} />);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("keeps signed-in shopper actions available once in the mobile menu", async () => {
    render(<SiteNav isSignedIn cartItemCount={3} />);

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const menu = screen.getByRole("navigation", { name: "Mobile navigation" });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /cart, 3 items/i })).toBeVisible();
      expect(within(menu).getByRole("link", { name: "Orders" })).toBeVisible();
      expect(within(menu).getByRole("link", { name: "Account" })).toBeVisible();
      expect(within(menu).getByRole("button", { name: "Sign out" })).toBeVisible();
    });
    expect(within(menu).getAllByRole("link", { name: "Orders" })).toHaveLength(1);
    expect(within(menu).getAllByRole("link", { name: "Account" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /cart, 3 items/i })).toHaveLength(1);
  });

  it("keeps the admin dashboard and sign-out action available once in the mobile menu", async () => {
    render(<SiteNav isSignedIn isAdmin cartItemCount={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const menu = screen.getByRole("navigation", { name: "Mobile navigation" });

    await waitFor(() => {
      expect(within(menu).getByRole("link", { name: "Dashboard" })).toBeVisible();
      expect(within(menu).getByRole("button", { name: "Sign out" })).toBeVisible();
    });
    expect(within(menu).getAllByRole("link", { name: "Dashboard" })).toHaveLength(1);
  });
});
