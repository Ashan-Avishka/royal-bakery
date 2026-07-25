import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { uploadProductImage } from "./uploadService.js";

const PRODUCT_ID = "55555555-5555-5555-5555-555555555555";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("uploadProductImage", () => {
  it("uploads the file and returns a public URL scoped to the product id", async () => {
    const url = await uploadProductImage(PRODUCT_ID, {
      buffer: Buffer.from("fake-image-bytes"),
      mimetype: "image/png",
      originalname: "my photo.png",
    });

    expect(url).toContain("product-images");
    expect(url).toContain(PRODUCT_ID);
  });

  it("sanitizes unsafe characters from the original filename", async () => {
    const url = await uploadProductImage(PRODUCT_ID, {
      buffer: Buffer.from("x"),
      mimetype: "image/jpeg",
      originalname: "a b?c.jpg",
    });

    expect(url).not.toMatch(/[ ?]/);
  });
});
