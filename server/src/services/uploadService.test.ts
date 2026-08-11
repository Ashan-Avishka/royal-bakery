import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { uploadProductImage, deleteProductImage } from "./uploadService.js";

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

describe("deleteProductImage", () => {
  it("calls storage.remove with the path extracted from the public URL", async () => {
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: () => ({ remove }) },
    } as any);

    await deleteProductImage(
      `https://fake-storage.test/product-images/${PRODUCT_ID}/167-photo.png`
    );

    expect(remove).toHaveBeenCalledWith([`${PRODUCT_ID}/167-photo.png`]);
  });

  it("does nothing if the url doesn't contain the bucket segment", async () => {
    const remove = vi.fn();
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: () => ({ remove }) },
    } as any);

    await deleteProductImage("https://example.test/not-a-bucket-url.png");

    expect(remove).not.toHaveBeenCalled();
  });

  it("logs and does not throw when storage.remove returns an error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const remove = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: () => ({ remove }) },
    } as any);

    await expect(
      deleteProductImage(`https://fake-storage.test/product-images/${PRODUCT_ID}/167-photo.png`)
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("logs and does not throw when storage.remove itself throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const remove = vi.fn().mockRejectedValue(new Error("network exception"));
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: () => ({ remove }) },
    } as any);

    await expect(
      deleteProductImage(`https://fake-storage.test/product-images/${PRODUCT_ID}/167-photo.png`)
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
