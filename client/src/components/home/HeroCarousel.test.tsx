import { fireEvent, render, screen } from "@testing-library/react";
import {
  createElement,
  type ComponentProps,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { expect, it, vi } from "vitest";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";

vi.mock("next/image", () => ({
  default: ({ priority, fill, ...props }: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) => {
    void fill;
    return createElement("img", { ...props, "data-priority": priority ? "true" : undefined });
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

it("only preloads the first hero slide", () => {
  render(<HeroCarousel slides={slides} />);

  expect(screen.getByRole("img", { name: "First hero" })).toHaveAttribute("data-priority", "true");
  fireEvent.click(screen.getByRole("tab", { name: "Go to slide 2" }));
  expect(screen.getByRole("img", { name: "Second hero" })).not.toHaveAttribute("data-priority");
});
