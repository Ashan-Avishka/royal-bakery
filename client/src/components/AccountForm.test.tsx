import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AccountForm } from "./AccountForm";

const actionState = vi.hoisted(() => ({ state: { error: "Unable to save profile.", success: false } }));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [actionState.state, vi.fn(), false],
}));

const profile = { email: "shopper@example.com", fullName: "Shopper", phone: null, address: null, role: "customer" as const };

it("associates account update failures with the profile form", () => {
  render(<AccountForm profile={profile} />);

  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("Unable to save profile.");
  expect(alert.closest("form")).toHaveAttribute("aria-describedby", alert.id);
});
