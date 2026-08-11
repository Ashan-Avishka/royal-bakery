import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { HomeHeroStage } from "./HomeHeroStage";

vi.mock("./HeroCarousel", () => ({
  HeroCarousel: () => <section aria-label="Featured promotions" />,
}));

vi.mock("./TrustBar", () => ({
  TrustBar: () => <section aria-label="Bakery benefits" />,
}));

it("keeps the hero and one-column trust content scrollable instead of clipping it", () => {
  render(<HomeHeroStage slides={[]} />);

  const stage = screen.getByLabelText("Featured promotions").parentElement?.parentElement;
  expect(stage).toHaveClass("min-h-dvh");
  expect(stage).not.toHaveClass("h-dvh", "max-h-dvh", "overflow-hidden");
  expect(screen.getByLabelText("Featured promotions").parentElement).toHaveClass("min-h-80");
});
