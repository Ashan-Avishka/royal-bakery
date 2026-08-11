import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_IMAGE_MANIFEST, validateManifest } from "./productImageManifest.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(scriptDirectory, "../../System/assets/products");

describe("PRODUCT_IMAGE_MANIFEST", () => {
  it("maps exactly 31 unique files to 31 unique products", () => {
    expect(PRODUCT_IMAGE_MANIFEST).toHaveLength(31);
    expect(new Set(PRODUCT_IMAGE_MANIFEST.map((item) => item.fileName)).size).toBe(31);
    expect(new Set(PRODUCT_IMAGE_MANIFEST.map((item) => item.productName)).size).toBe(31);
  });

  it("preserves source spelling while mapping canonical product names", () => {
    expect(PRODUCT_IMAGE_MANIFEST).toContainEqual({ fileName: "chiken_roll.png", productName: "Chicken Rolls" });
    expect(PRODUCT_IMAGE_MANIFEST).toContainEqual({ fileName: "robbon_cake.png", productName: "Ribbon Cake" });
    expect(PRODUCT_IMAGE_MANIFEST).toContainEqual({ fileName: "kibula_bun.png", productName: "Kimbula Buns" });
  });

  it("finds every declared source file", async () => {
    await expect(validateManifest(sourceDirectory)).resolves.toBeUndefined();
  });
});
