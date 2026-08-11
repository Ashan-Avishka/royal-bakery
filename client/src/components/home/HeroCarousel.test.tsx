import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  createElement,
  type ComponentProps,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { afterEach, expect, it, vi } from "vitest";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";

vi.mock("next/image", () => ({
  default: ({ preload, fill, ...props }: ComponentProps<"img"> & { preload?: boolean; fill?: boolean }) => {
    void fill;
    return createElement("img", { ...props, "data-preload": preload ? "true" : undefined });
  },
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
}));

const slides: HeroSlide[] = [
  { id: "first", brand: "Royal Bakery", headline: "First", support: "One", ctaLabel: "Shop", ctaHref: "/products", imageSrc: "/one.jpg", imageAlt: "First hero" },
  { id: "second", brand: "Royal Bakery", headline: "Second", support: "Two", ctaLabel: "Shop", ctaHref: "/products", imageSrc: "/two.jpg", imageAlt: "Second hero" },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("only preloads the first hero slide", () => {
  render(<HeroCarousel slides={slides} />);

  expect(screen.getByRole("img", { name: "First hero" })).toHaveAttribute("data-preload", "true");
  fireEvent.click(screen.getByRole("tab", { name: "Go to slide 2" }));
  expect(screen.getByRole("img", { name: "Second hero" })).not.toHaveAttribute("data-preload");
});

it("pauses autoplay while focus stays in the hero and exposes a touch-sized pause control", () => {
  vi.useFakeTimers();
  render(<HeroCarousel slides={slides} />);
  const hero = screen.getByRole("region", { name: "Featured promotions" });
  const secondTab = screen.getByRole("tab", { name: "Go to slide 2" });

  fireEvent.focus(hero);
  fireEvent.blur(hero, { relatedTarget: secondTab });
  fireEvent.focus(secondTab);
  act(() => vi.advanceTimersByTime(7000));

  expect(screen.getByRole("img", { name: "First hero" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Pause auto-advance" })).toHaveClass(
    "h-11",
    "w-11"
  );

  fireEvent.click(screen.getByRole("button", { name: "Pause auto-advance" }));
  expect(screen.getByRole("button", { name: "Resume auto-advance" })).toBeVisible();
});

it("uses a touch-sized CTA link without nesting a button", () => {
  render(<HeroCarousel slides={slides} />);
  const link = screen.getByRole("link", { name: "Shop" });
  expect(link).toHaveClass("min-h-11");
  expect(link.querySelector("button")).toBeNull();
});
