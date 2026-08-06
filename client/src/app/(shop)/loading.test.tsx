import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ShopLoading from "./loading";

it("announces storefront loading without adding a nested main landmark", () => {
  const { container } = render(<ShopLoading />);

  const status = screen.getByRole("status", { name: "Loading storefront" });
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status.children).toHaveLength(1);
  expect(container.querySelector("main")).not.toBeInTheDocument();
});
