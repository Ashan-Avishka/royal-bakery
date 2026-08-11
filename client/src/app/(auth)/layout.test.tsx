import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import AuthLayout from "./layout";

it("uses one-rem auth card padding before the small breakpoint", () => {
  const { container } = render(
    <AuthLayout>
      <p>Authentication form</p>
    </AuthLayout>
  );

  expect(container.querySelector(".max-w-md")).toHaveClass("surface-pad", "sm:p-10");
});
