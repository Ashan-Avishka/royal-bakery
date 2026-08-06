import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SubmitButton } from "./SubmitButton";

const formStatusMocks = vi.hoisted(() => ({
  useFormStatus: vi.fn(),
}));

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: formStatusMocks.useFormStatus,
}));

beforeEach(() => {
  formStatusMocks.useFormStatus.mockReturnValue({ pending: false });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows the idle label while its parent form is idle", () => {
  render(<SubmitButton idleLabel="Update" pendingLabel="Updating..." />);

  expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
});

it("disables itself and shows pending feedback during submission", () => {
  formStatusMocks.useFormStatus.mockReturnValue({ pending: true });

  render(<SubmitButton idleLabel="Remove" pendingLabel="Removing..." />);

  expect(screen.getByRole("button", { name: "Removing..." })).toBeDisabled();
});
