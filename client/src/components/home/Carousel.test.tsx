import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Carousel } from "./Carousel";

vi.mock("framer-motion", () => ({
  useReducedMotion: () => true,
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
});

afterEach(() => vi.unstubAllGlobals());

it("uses immediate keyboard scrolling and disables smooth scrolling for reduced motion", () => {
  const scrollBy = vi.fn();
  render(
    <Carousel ariaLabel="Seasonal bakes">
      <button type="button">Seasonal bun</button>
    </Carousel>
  );
  const region = screen.getByRole("region", { name: /seasonal bakes/i });
  Object.defineProperty(region, "clientWidth", { configurable: true, value: 400 });
  Object.defineProperty(region, "scrollBy", { configurable: true, value: scrollBy });

  fireEvent.keyDown(region, { key: "ArrowRight" });

  expect(scrollBy).toHaveBeenCalledWith({ left: 288, behavior: "auto" });
  expect(region).toHaveClass("motion-reduce:scroll-auto");
});
