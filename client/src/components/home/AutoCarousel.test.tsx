import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoCarousel } from "./AutoCarousel";

vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
}));

function renderCarousel(count = 10) {
  return render(
    <AutoCarousel ariaLabel="Featured bakes">
      {Array.from({ length: count }, (_, index) => (
        <button key={index} type="button">
          Item {index + 1}
        </button>
      ))}
    </AutoCarousel>
  );
}

describe("AutoCarousel", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uses compact paging with 44px navigation targets for long rails", () => {
    renderCarousel();

    expect(screen.getByText("1 / 10")).toBeVisible();
    expect(screen.queryByRole("button", { name: /slide group/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toHaveClass("h-11", "w-11");
  });

  it("hides offscreen cards from assistive technology as the rail advances", () => {
    renderCarousel(3);

    expect(screen.getByRole("button", { name: "Item 1" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Item 2" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.queryByRole("button", { name: "Item 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Item 2" })).toBeVisible();
  });

  it("clamps navigation to the new page count after a breakpoint resize", () => {
    renderCarousel();
    const next = screen.getByRole("button", { name: "Next" });

    for (let step = 0; step < 8; step += 1) fireEvent.click(next);
    expect(screen.getByText("9 / 10")).toBeVisible();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    fireEvent(window, new Event("resize"));

    expect(screen.getByText("8 / 8")).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByText("1 / 8")).toBeVisible();
  });

  it("pauses automatic advancement on focus and through its pause control", () => {
    vi.useFakeTimers();
    renderCarousel(3);
    const region = screen.getByRole("region", { name: /featured bakes/i });

    fireEvent.focus(region);
    act(() => vi.advanceTimersByTime(4200));
    expect(screen.getByRole("button", { name: "Item 1" })).toBeVisible();

    fireEvent.blur(region);
    fireEvent.click(screen.getByRole("button", { name: "Pause auto-advance" }));
    expect(screen.getByRole("button", { name: "Resume auto-advance" })).toBeVisible();
    act(() => vi.advanceTimersByTime(4200));
    expect(screen.getByRole("button", { name: "Item 1" })).toBeVisible();
  });
});
