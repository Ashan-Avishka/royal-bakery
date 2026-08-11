import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import {
  importProductImages,
  PRODUCT_IMAGE_MANIFEST,
  parseArguments,
  runImageImportCli,
  targetEnvironmentFiles,
  verifyProductImageUrls,
  type ImportDependencies,
} from "./importProductImages.js";

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

  it("resolves established seed aliases while validating the default manifest", async () => {
    const deps = dependencies();
    const aliases: Record<string, string> = {
      "Cream Buns": "cream bun",
      "Tea Buns": "sweet buns",
      "Fish Rolls": "rolls",
      "Chocolate Cake": "chocolate truffle cake",
    };
    vi.mocked(deps.listProducts).mockResolvedValue(
      PRODUCT_IMAGE_MANIFEST.map((mapping, index) => ({
        id: `product-${index}`,
        name: aliases[mapping.productName] ?? mapping.productName,
      }))
    );

    const report = await importProductImages(
      { sourceDirectory: path.resolve(import.meta.dirname, "../../System/assets/products"), execute: false, environmentName: "local" },
      deps
    );

    expect(report).toMatchObject({ validated: 31, failures: [] });
  });
});

describe("runImageImportCli", () => {
  const targetDependencies = () => ({ ...dependencies(), listProductsForVerification: vi.fn().mockResolvedValue([]) });

  it("continues with hosted execution when local target setup fails", async () => {
    const hosted = targetDependencies();
    const reports = await runImageImportCli(
      { target: "all", execute: false, verify: false },
      { sourceDirectory: "C:/images", createDependencies: (target) => {
        if (target.name === "local") throw new Error("local unavailable");
        return hosted;
      } },
      [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
    );

    expect(reports).toEqual([
      expect.objectContaining({ environmentName: "local", failures: [{ productName: "local", message: "local unavailable" }] }),
      expect.objectContaining({ environmentName: "hosted", validated: 1 }),
    ]);
    expect(hosted.readSource).toHaveBeenCalledOnce();
  });

  it("prints a final target report with mutation totals and verification failure details", async () => {
    const local = targetDependencies();
    const serializedReports: string[] = [];
    const reports = await runImageImportCli(
      { target: "local", execute: true, verify: true },
      {
        sourceDirectory: "C:/images",
        createDependencies: () => local,
        printReport: (report) => serializedReports.push(JSON.stringify(report)),
        verify: vi.fn().mockRejectedValue(new Error("verification unavailable")),
      },
      [{ fileName: "butter_cake.png", productName: "Butter Cake" }]
    );

    expect(JSON.parse(serializedReports[0]!)).toEqual({
      environmentName: "local",
      validated: 1,
      uploaded: 1,
      updated: 1,
      failures: [{ productName: "verification", message: "verification unavailable" }],
    });
    expect(reports[0]).toMatchObject({ uploaded: 1, updated: 1, failures: [{ productName: "verification", message: "verification unavailable" }] });
  });
});

describe("image import CLI", () => {
  it("defaults to dry-run and requires a valid target", () => {
    expect(parseArguments(["--target", "all"])).toEqual({ target: "all", execute: false, verify: false });
    expect(parseArguments(["--target", "hosted", "--verify"])).toEqual({ target: "hosted", execute: false, verify: true });
    expect(() => parseArguments(["--target", "production"])).toThrow("Target must be local, hosted, or all");
  });

  it("maps all to independent ignored environment files", () => {
    expect(targetEnvironmentFiles("all")).toEqual([
      { name: "local", fileName: ".env.local" },
      { name: "hosted", fileName: ".env.hosted.local" },
    ]);
  });
});

describe("verifyProductImageUrls", () => {
  it("accepts stable WebP URLs that return HTTP 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("webp", {
      status: 200,
      headers: { "content-type": "image/webp" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyProductImageUrls([
      { id: "product-1", name: "Butter Cake", imageUrl: "https://example.test/product-1/catalog.webp" },
    ], [{ fileName: "butter_cake.png", productName: "Butter Cake" }])).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/product-1/catalog.webp");
    vi.unstubAllGlobals();
  });

  it("rejects a WebP URL that does not return HTTP 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {
      status: 404,
      headers: { "content-type": "image/webp" },
    })));

    await expect(verifyProductImageUrls([
      { id: "product-1", name: "Butter Cake", imageUrl: "https://example.test/product-1/catalog.webp" },
    ], [{ fileName: "butter_cake.png", productName: "Butter Cake" }])).rejects.toThrow("returned HTTP 404");

    vi.unstubAllGlobals();
  });

  it("rejects a successful URL that does not serve WebP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("image", {
      status: 200,
      headers: { "content-type": "image/png" },
    })));

    await expect(verifyProductImageUrls([
      { id: "product-1", name: "Butter Cake", imageUrl: "https://example.test/product-1/catalog.webp" },
    ], [{ fileName: "butter_cake.png", productName: "Butter Cake" }])).rejects.toThrow("did not return image/webp");

    vi.unstubAllGlobals();
  });
});
