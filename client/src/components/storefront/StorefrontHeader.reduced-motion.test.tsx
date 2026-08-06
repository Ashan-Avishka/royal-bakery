import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    nav: ({
      children,
      initial,
      exit,
      ...props
    }: {
      children: ReactNode;
      initial: { opacity: number; y: number };
      exit: { opacity: number; y: number };
    }) => (
      <nav
        {...props}
        data-initial-opacity={initial.opacity}
        data-initial-y={initial.y}
        data-exit-opacity={exit.opacity}
        data-exit-y={exit.y}
      >
        {children}
      </nav>
    ),
  },
  useReducedMotion: () => true,
}));

import { StorefrontHeader } from "./StorefrontHeader";

it("removes the mobile menu spatial offset when reduced motion is requested", () => {
  render(<StorefrontHeader signedIn={false} isAdmin={false} cartItemCount={0} />);

  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

  const mobileNavigation = screen.getByRole("navigation", {
    name: "Mobile navigation",
  });
  expect(mobileNavigation).toHaveAttribute("data-initial-y", "0");
  expect(mobileNavigation).toHaveAttribute("data-exit-y", "0");
  expect(mobileNavigation).toHaveAttribute("data-initial-opacity", "0");
  expect(mobileNavigation).toHaveAttribute("data-exit-opacity", "0");
});
