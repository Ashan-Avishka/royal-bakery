import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import SignupPage from "./page";

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [{ error: null, message: "Check your inbox to finish creating your account." }, vi.fn(), false],
}));

it("announces signup completion and keeps the return link touch-sized", () => {
  render(<SignupPage />);

  expect(screen.getByRole("status")).toHaveTextContent("Check your inbox to finish creating your account.");
  expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveClass("min-h-11", "text-caramel-hover");
});
