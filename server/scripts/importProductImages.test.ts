import { describe, expect, it, vi } from "vitest";
import { importProductImages, type ImportDependencies } from "./importProductImages.js";

function dependencies(): ImportDependencies {
  return {
    readSource: vi.fn().mockResolvedValue(Buffer.from("png")),
    convertToWebp: vi.fn().mockResolvedValue(Buffer.from("webp")),
    listProducts: vi.fn().mockResolvedValue([{ id: "product-1", name: "Butter Cake" }]),
    upload: vi.fn().mockResolvedValue(undefined),
    publicUrl: vi.fn().mockReturnValue("https://example.test/product-images/product-1/catalog.webp"),
    updateImageUrl: vi.fn().mockResolvedValue(undefined),
  };
}

describe("importProductImages", () => {
  it("uploads a WebP to a stable product path before updating the row", async () => {
    const deps = dependencies();
    const report = await importProductImages(
      { sourceDirectory: "C:/images", execute: true, environmentName: "local" },
      deps,
      [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
    );
    expect(deps.upload).toHaveBeenCalledWith("product-1/catalog.webp", Buffer.from("webp"), "image/webp");
    expect(deps.updateImageUrl).toHaveBeenCalledWith("product-1", "https://example.test/product-images/product-1/catalog.webp");
    expect(vi.mocked(deps.upload).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(deps.updateImageUrl).mock.invocationCallOrder[0]);
    expect(report).toMatchObject({ validated: 1, uploaded: 1, updated: 1, failures: [] });
  });

  it("performs no writes during dry-run", async () => {
    const deps = dependencies();
    await importProductImages(
      { sourceDirectory: "C:/images", execute: false, environmentName: "hosted" },
      deps,
      [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
    );
    expect(deps.upload).not.toHaveBeenCalled();
    expect(deps.updateImageUrl).not.toHaveBeenCalled();
  });

  it("does not update a row when upload fails", async () => {
    const deps = dependencies();
    vi.mocked(deps.upload).mockRejectedValue(new Error("storage unavailable"));
    const report = await importProductImages(
      { sourceDirectory: "C:/images", execute: true, environmentName: "local" },
      deps,
      [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
    );
    expect(deps.updateImageUrl).not.toHaveBeenCalled();
    expect(report.failures).toEqual([{ productName: "Butter Cake", message: "storage unavailable" }]);
  });

  it("fails before processing when a mapped catalog product is missing", async () => {
    const deps = dependencies();
    vi.mocked(deps.listProducts).mockResolvedValue([]);

    await expect(
      importProductImages(
        { sourceDirectory: "C:/images", execute: true, environmentName: "local" },
        deps,
        [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
      )
    ).rejects.toThrow('No catalog product found for "Butter Cake"');
    expect(deps.readSource).not.toHaveBeenCalled();
    expect(deps.upload).not.toHaveBeenCalled();
  });

  it("fails before processing when a mapped catalog product is duplicated", async () => {
    const deps = dependencies();
    vi.mocked(deps.listProducts).mockResolvedValue([
      { id: "product-1", name: "Butter Cake" },
      { id: "product-2", name: " butter cake " },
    ]);

    await expect(
      importProductImages(
        { sourceDirectory: "C:/images", execute: true, environmentName: "local" },
        deps,
        [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
      )
    ).rejects.toThrow('Expected exactly one catalog product for "Butter Cake", found 2');
    expect(deps.readSource).not.toHaveBeenCalled();
    expect(deps.upload).not.toHaveBeenCalled();
  });
});
