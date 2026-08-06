import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ShopError from "./error";

it("renders the retry state without adding a nested main landmark", () => {
  const { container } = render(<ShopError error={new Error("Unavailable")} reset={vi.fn()} />);

  expect(container.querySelector("main")).not.toBeInTheDocument();
});
