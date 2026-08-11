import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { HomeHeroStage } from "./HomeHeroStage";

vi.mock("./HeroCarousel", () => ({
  HeroCarousel: () => <section aria-label="Featured promotions" />,
}));

vi.mock("./TrustBar", () => ({
  TrustBar: () => <section aria-label="Bakery benefits" />,
}));

it("gives the hero stage a definite height so the hero fills its flex share, without clipping trust content", () => {
  render(<HomeHeroStage slides={[]} />);

  // A definite (not min-) height is required for the hero's internal h-full
  // chain to resolve — with only min-h-dvh, the hero's flex-grown height is
  // indefinite and its percentage-height children collapse to auto, leaving
  // a gap above the trust bar instead of filling the available space.
  const stage = screen.getByLabelText("Featured promotions").parentElement?.parentElement;
  expect(stage).toHaveClass("h-dvh");
  expect(stage).not.toHaveClass("min-h-dvh", "max-h-dvh", "overflow-hidden");
  expect(screen.getByLabelText("Featured promotions").parentElement).toHaveClass("min-h-80");
});
