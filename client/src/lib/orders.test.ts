import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { getOrder } from "./orders";

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: mocks.api,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("getOrder", () => {
  it("returns null for a 404 (well-formed id, order not found)", async () => {
    mocks.api.mockRejectedValue(new ApiError(404, "Order not found"));

    await expect(getOrder("token", "missing-order")).resolves.toBeNull();
  });

  it("returns null for a 400 (malformed id) instead of throwing", async () => {
    mocks.api.mockRejectedValue(new ApiError(400, "Invalid order id"));

    await expect(getOrder("token", "not-a-real-id")).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    mocks.api.mockRejectedValue(new ApiError(500, "Server error"));

    await expect(getOrder("token", "order-1")).rejects.toThrow("Server error");
  });
});
