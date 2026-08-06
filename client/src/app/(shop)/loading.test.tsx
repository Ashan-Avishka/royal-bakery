import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ShopLoading from "./loading";

it("announces storefront loading without adding a nested main landmark", () => {
  const { container } = render(<ShopLoading />);

  expect(screen.getByRole("status", { name: "Loading storefront" })).toHaveAttribute(
    "aria-live",
    "polite"
  );
  expect(container.querySelector("main")).not.toBeInTheDocument();
});
