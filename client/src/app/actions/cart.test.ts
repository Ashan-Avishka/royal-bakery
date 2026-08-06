import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { removeCartItem, updateCartItemQuantity } from "./cart";

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  redirect: vi.fn(),
  refresh: vi.fn(),
  revalidatePath: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: mocks.api,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getSession: mocks.getSession },
  }),
}));

vi.mock("next/cache", () => ({
  refresh: mocks.refresh,
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

beforeEach(() => {
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: "access-token" } },
  });
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("cart mutation error localization", () => {
  it("keeps the update payload and redirects an update error with its product ID", async () => {
    mocks.api.mockRejectedValue(new ApiError(409, "Only four cakes remain."));
    const formData = new FormData();
    formData.set("productId", "cake-1");
    formData.set("quantity", "4");

    await expect(updateCartItemQuantity(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cart?error=Only+four+cakes+remain.&errorProductId=cake-1"
    );
    expect(mocks.api).toHaveBeenCalledWith("/api/cart/cake-1", {
      method: "PUT",
      headers: { Authorization: "Bearer access-token" },
      body: JSON.stringify({ quantity: 4 }),
    });
  });

  it("keeps the remove payload and redirects a remove error with its product ID", async () => {
    mocks.api.mockRejectedValue(new ApiError(409, "This item cannot be removed."));
    const formData = new FormData();
    formData.set("productId", "cake-1");

    await expect(removeCartItem(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cart?error=This+item+cannot+be+removed.&errorProductId=cake-1"
    );
    expect(mocks.api).toHaveBeenCalledWith("/api/cart/cake-1", {
      method: "DELETE",
      headers: { Authorization: "Bearer access-token" },
    });
  });
});
