import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import LoginPage from "./page";

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [{ error: "Invalid email or password." }, vi.fn(), false],
}));

it("associates sign-in failures with the submitted form and uses a touch-sized account link", () => {
  render(<LoginPage />);

  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("Invalid email or password.");
  expect(alert.closest("form")).toHaveAttribute("aria-describedby", alert.id);
  expect(screen.getByRole("link", { name: "Sign up" })).toHaveClass("min-h-11", "text-caramel-hover");
});
