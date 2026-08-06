import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  return {
    MotionConfig: ({ children, reducedMotion }: { children: ReactNode; reducedMotion?: string }) => (
      <div data-reduced-motion={reducedMotion}>{children}</div>
    ),
    motion: {
      div: ({ children, className }: { children: ReactNode; className?: string }) => (
        <div className={className}>{children}</div>
      ),
    },
    useReducedMotion: () => false,
  };
});

import { MotionProvider } from "./MotionProvider";
import { Reveal } from "./Reveal";
import { StaggerGrid, StaggerItem } from "./StaggerGrid";

describe("motion primitives", () => {
  it("renders reveal content without hiding semantic children", () => {
    render(
      <Reveal>
        <h2>Featured products</h2>
      </Reveal>
    );

    expect(screen.getByRole("heading", { name: "Featured products" })).toBeVisible();
  });

  it("preserves custom class names on motion wrappers", () => {
    const { container } = render(
      <StaggerGrid className="product-grid">
        <StaggerItem className="product-card">Sourdough</StaggerItem>
      </StaggerGrid>
    );

    expect(container.querySelector(".product-grid")).toBeInTheDocument();
    expect(container.querySelector(".product-card")).toHaveTextContent("Sourdough");
  });

  it("configures motion for the user's reduced-motion preference", () => {
    render(
      <MotionProvider>
        <p>Freshly baked</p>
      </MotionProvider>
    );

    expect(screen.getByText("Freshly baked").parentElement).toHaveAttribute(
      "data-reduced-motion",
      "user"
    );
  });
});
