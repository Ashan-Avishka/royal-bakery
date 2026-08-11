import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ProductImage } from "./ProductImage";

afterEach(cleanup);

it("renders an accessible fallback for a missing image", () => {
  render(<ProductImage src={null} alt="Butter Cake" fill />);
  expect(screen.getByRole("img", { name: "Butter Cake photo unavailable" })).toBeVisible();
  expect(screen.queryByRole("img", { name: "Butter Cake" })).not.toBeInTheDocument();
});

it("replaces a failed image with the same accessible fallback", () => {
  render(<ProductImage src="https://images.example.test/butter-cake.webp" alt="Butter Cake" fill />);
  fireEvent.error(screen.getByRole("img", { name: "Butter Cake" }));
  expect(screen.getByRole("img", { name: "Butter Cake photo unavailable" })).toBeVisible();
  expect(screen.queryByRole("img", { name: "Butter Cake" })).not.toBeInTheDocument();
});
