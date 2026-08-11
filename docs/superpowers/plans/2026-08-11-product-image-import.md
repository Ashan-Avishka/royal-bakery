# Product Image Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 31 supplied product PNGs to optimized WebP buffers, upload them deterministically to both local and hosted Supabase Storage, and update every matching product row safely.

**Architecture:** A pure manifest module owns the exact filename-to-product mapping. A focused importer validates the complete source/product set, converts with Sharp, uploads to stable object paths, and updates rows only after successful uploads. A small CLI selects local, hosted, or both environment files and defaults to dry-run so database changes require an explicit `--execute` flag.

**Tech Stack:** TypeScript 7, Node.js 20+, Sharp, Supabase JavaScript 2.110, Vitest 3, dotenv

## Global Constraints

- Keep all 31 PNG files under `System/assets/products` byte-for-byte unchanged.
- Store derivatives as WebP at `<product-id>/catalog.webp` in the public `product-images` bucket.
- Support `local`, `hosted`, and `all`; never print credentials.
- Validate the entire manifest and product set before the first upload.
- Update `products.image_url` only after that product's upload succeeds.
- Reruns must replace the stable object and must not create timestamped duplicates.
- Do not delete older unrelated Storage objects.

---

## File Structure

- `server/scripts/productImageManifest.ts`: the immutable 31-item source-to-product mapping and mapping validation.
- `server/scripts/importProductImages.ts`: conversion, Supabase operations, dry-run behavior, target parsing, and CLI entry point.
- `server/scripts/productImageManifest.test.ts`: manifest completeness and alias/spelling regression tests.
- `server/scripts/importProductImages.test.ts`: importer sequencing, path, failure, and dry-run tests with injected dependencies.
- `server/package.json` and `server/package-lock.json`: Sharp dependency and image-import commands.
- `.gitignore`: generated image-import cache coverage if implementation creates a disk cache.
- `System/assets/products/*.png`: the user-supplied source set, committed unchanged.
- `server/.env.local`: ignored local target credentials.
- `server/.env.hosted.local`: ignored hosted target credentials.

### Task 1: Lock the product-image manifest

**Files:**
- Create: `server/scripts/productImageManifest.ts`
- Create: `server/scripts/productImageManifest.test.ts`
- Include unchanged: `System/assets/products/*.png`

**Interfaces:**
- Produces: `PRODUCT_IMAGE_MANIFEST: readonly ProductImageMapping[]`
- Produces: `validateManifest(sourceDirectory: string): Promise<void>`
- Produces: `ProductImageMapping { fileName: string; productName: string }`

- [ ] **Step 1: Write the failing manifest tests**

```ts
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
```

- [ ] **Step 2: Run the manifest test and confirm the module is missing**

Run: `cd server && npm test -- scripts/productImageManifest.test.ts`

Expected: FAIL because `productImageManifest.ts` does not exist.

- [ ] **Step 3: Implement the typed manifest and complete-file validation**

Create the exported type, this frozen 31-entry list matching the catalog in
`seedCatalog.ts`, and the validator below it:

```ts
import { access } from "node:fs/promises";
import path from "node:path";

export interface ProductImageMapping {
  fileName: string;
  productName: string;
}

export const PRODUCT_IMAGE_MANIFEST = [
  { fileName: "sandwich_bread.png", productName: "Sandwich Bread" },
  { fileName: "normal_bread.png", productName: "Normal Bread" },
  { fileName: "milk_bread.png", productName: "Milk Bread" },
  { fileName: "kibula_bun.png", productName: "Kimbula Buns" },
  { fileName: "seeni_bun.png", productName: "Seeni Buns" },
  { fileName: "fish_bun.png", productName: "Fish Buns" },
  { fileName: "jam_bun.png", productName: "Jam Buns" },
  { fileName: "seeni_sambal_bun.png", productName: "Seeni Sambal Buns" },
  { fileName: "cream_bun.png", productName: "Cream Buns" },
  { fileName: "tea_bun.png", productName: "Tea Buns" },
  { fileName: "sausage_bun.png", productName: "Sausage Buns" },
  { fileName: "butter_cake.png", productName: "Butter Cake" },
  { fileName: "chocolate_cake.png", productName: "Chocolate Cake" },
  { fileName: "robbon_cake.png", productName: "Ribbon Cake" },
  { fileName: "coconut_cake.png", productName: "Coconut Cake" },
  { fileName: "egg_roll.png", productName: "Egg Rolls" },
  { fileName: "veg_roll.png", productName: "Veg Rolls" },
  { fileName: "fish_roll.png", productName: "Fish Rolls" },
  { fileName: "chiken_roll.png", productName: "Chicken Rolls" },
  { fileName: "egg_pattie.png", productName: "Egg Pattie" },
  { fileName: "fish_pattie.png", productName: "Fish Pattie" },
  { fileName: "veg_pattie.png", productName: "Veg Pattie" },
  { fileName: "veg_roti.png", productName: "Veg Rotti" },
  { fileName: "fish_roti.png", productName: "Fish Rotti" },
  { fileName: "egg_roti.png", productName: "Egg Rotti" },
  { fileName: "fish_pastry.png", productName: "Fish Pastry" },
  { fileName: "chiken_pastry.png", productName: "Chicken Pastry" },
  { fileName: "veg_pastry.png", productName: "Vegetable Pastry" },
  { fileName: "jam_tart.png", productName: "Jam Tart" },
  { fileName: "cream_doughnut.png", productName: "Cream Doughnut" },
  { fileName: "chocolate_muffin.png", productName: "Chocolate Muffin" },
] as const satisfies readonly ProductImageMapping[];

export async function validateManifest(sourceDirectory: string): Promise<void> {
  if (PRODUCT_IMAGE_MANIFEST.length !== 31) {
    throw new Error(`Expected 31 product image mappings, found ${PRODUCT_IMAGE_MANIFEST.length}`);
  }
  const files = new Set(PRODUCT_IMAGE_MANIFEST.map((item) => item.fileName));
  const products = new Set(PRODUCT_IMAGE_MANIFEST.map((item) => item.productName.toLowerCase()));
  if (files.size !== 31 || products.size !== 31) {
    throw new Error("Product image manifest contains duplicate files or product names");
  }
  await Promise.all(
    PRODUCT_IMAGE_MANIFEST.map((item) => access(path.join(sourceDirectory, item.fileName)))
  );
}
```

- [ ] **Step 4: Run the manifest tests**

Run: `cd server && npm test -- scripts/productImageManifest.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the manifest and original assets**

```bash
git add server/scripts/productImageManifest.ts server/scripts/productImageManifest.test.ts System/assets/products
git commit -m "feat(catalog): map real product images"
```

### Task 2: Build the testable conversion and upload pipeline

**Files:**
- Create: `server/scripts/importProductImages.ts`
- Create: `server/scripts/importProductImages.test.ts`
- Modify: `server/package.json`
- Modify: `server/package-lock.json`

**Interfaces:**
- Consumes: `PRODUCT_IMAGE_MANIFEST`, `ProductImageMapping`, `validateManifest`
- Produces: `ImportDependencies { readSource; convertToWebp; listProducts; upload; publicUrl; updateImageUrl }`
- Produces: `importProductImages(options: ImportOptions, dependencies: ImportDependencies, mappings?: readonly ProductImageMapping[]): Promise<ImportReport>`
- Produces: `ImportOptions { sourceDirectory: string; execute: boolean; environmentName: string }`
- Produces: `ImportReport { environmentName: string; validated: number; uploaded: number; updated: number; failures: ImportFailure[] }`

- [ ] **Step 1: Install Sharp in the server package**

Run: `cd server && npm install sharp`

Expected: `sharp` appears in `server/package.json` dependencies and the lockfile changes.

- [ ] **Step 2: Write failing orchestration tests with injected dependencies**

```ts
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
});
```

- [ ] **Step 3: Run the importer tests and confirm they fail**

Run: `cd server && npm test -- scripts/importProductImages.test.ts`

Expected: FAIL because importer exports are missing.

- [ ] **Step 4: Implement validation-first import orchestration**

Implement product-name normalization with `trim().toLocaleLowerCase("en")`, assert
that every manifest name resolves to exactly one product before processing, and
convert with:

```ts
import sharp from "sharp";

export async function convertToWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();
}
```

The upload adapter must call:

```ts
await supabase.storage.from("product-images").upload(objectPath, webpBuffer, {
  contentType: "image/webp",
  cacheControl: "31536000",
  upsert: true,
});
```

Throw before uploads when mapped catalog products are missing or duplicated.
During processing, collect per-product operational failures and set a nonzero CLI
exit code after printing the report.

- [ ] **Step 5: Run the importer and manifest tests**

Run: `cd server && npm test -- scripts/productImageManifest.test.ts scripts/importProductImages.test.ts`

Expected: all tests PASS.

- [ ] **Step 6: Commit the import engine**

```bash
git add server/package.json server/package-lock.json server/scripts/importProductImages.ts server/scripts/importProductImages.test.ts
git commit -m "feat(catalog): add optimized image importer"
```

### Task 3: Add explicit environment targeting and safe commands

**Files:**
- Modify: `server/scripts/importProductImages.ts`
- Modify: `server/scripts/importProductImages.test.ts`
- Modify: `server/package.json`
- Modify: `README.md`

**Interfaces:**
- Produces CLI: `npm run images:dry-run -- --target local|hosted|all`
- Produces CLI: `npm run images:import -- --target local|hosted|all`
- Produces CLI verification flag: `--verify`
- Consumes ignored files: `server/.env.local`, `server/.env.hosted.local`

- [ ] **Step 1: Add failing parser and target-isolation tests**

```ts
import { describe, expect, it } from "vitest";
import { parseArguments, targetEnvironmentFiles } from "./importProductImages.js";

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
```

- [ ] **Step 2: Run the CLI tests and confirm they fail**

Run: `cd server && npm test -- scripts/importProductImages.test.ts`

Expected: FAIL because the parser exports are missing.

- [ ] **Step 3: Implement exact argument parsing and per-target client creation**

Accepted arguments are only `--target local|hosted|all`, optional `--execute`,
and optional `--verify`.
Load each file with `dotenv.config({ path, override: true })`, read
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, validate both without logging
values, create a new non-persistent Supabase client per target, and clear the two
process variables before loading the next target.

When `--verify` is present, select `id,name,image_url` for the complete mapped
product set, require each URL to end in `/<product-id>/catalog.webp`, fetch every
URL, and require HTTP 200 plus a `content-type` containing `image/webp`. Add a
mocked-fetch test for a success response and for a non-200 response. Verification
may run with dry-run or execute mode and performs no additional writes.

Add these package scripts:

```json
{
  "images:dry-run": "tsx scripts/importProductImages.ts",
  "images:import": "tsx scripts/importProductImages.ts --execute"
}
```

- [ ] **Step 4: Document exact configuration and commands**

Add a README section specifying that each ignored environment file contains:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=the-service-role-key-for-this-target
```

Use the actual hosted URL/key in `.env.hosted.local`, never in committed docs.
Document dry-run first, explicit execute second, and independent summary output.

- [ ] **Step 5: Run focused and full server verification**

Run: `cd server && npm test -- scripts/productImageManifest.test.ts scripts/importProductImages.test.ts`

Run: `cd server && npm run build`

Expected: tests PASS and TypeScript build exits 0.

- [ ] **Step 6: Commit CLI and documentation**

```bash
git add server/scripts/importProductImages.ts server/scripts/importProductImages.test.ts server/package.json README.md
git commit -m "docs(catalog): add safe image import commands"
```

### Task 4: Import and verify local Supabase

**Files:**
- Create locally, never commit: `server/.env.local`
- No source modification expected

**Interfaces:**
- Consumes CLI from Task 3
- Produces 31 local Storage objects and 31 local `products.image_url` values

- [ ] **Step 1: Confirm the local target is reachable without mutating data**

Run: `cd server && npm run images:dry-run -- --target local`

Expected: the report names `local`, validates 31 mappings, finds 31 unique product
records, and reports zero writes.

- [ ] **Step 2: Execute the local import**

Run: `cd server && npm run images:import -- --target local`

Expected: 31 uploads, 31 row updates, zero failures.

- [ ] **Step 3: Rerun to prove idempotency**

Run: `cd server && npm run images:import -- --target local`

Expected: the same 31 stable paths are replaced successfully; no new object paths
are reported.

- [ ] **Step 4: Verify local URLs and content type**

Run: `cd server && npm run images:dry-run -- --target local --verify`

Expected: 31 unique product IDs have stable public URLs, HTTP 200 responses, and
an `image/webp` content type.

### Task 5: Import and verify hosted Supabase

**Files:**
- Create locally, never commit: `server/.env.hosted.local`
- No source modification expected

**Interfaces:**
- Consumes CLI from Task 3
- Produces 31 hosted Storage objects and 31 hosted `products.image_url` values

- [ ] **Step 1: Confirm the hosted target without mutating data**

Run: `cd server && npm run images:dry-run -- --target hosted`

Expected: the report names `hosted`, validates 31 mappings, finds 31 unique product
records, and reports zero writes.

- [ ] **Step 2: Execute the hosted import**

Run: `cd server && npm run images:import -- --target hosted`

Expected: 31 uploads, 31 row updates, zero failures.

- [ ] **Step 3: Verify both environments in one report**

Run: `cd server && npm run images:dry-run -- --target all --verify`

Expected: local and hosted sections each report 31 reachable WebP URLs, correct
stable paths, and zero failures.

- [ ] **Step 4: Record completion evidence**

Save no credentials or full service-role-bearing command output. In the final
handoff, report the two 31/31 verification totals and any target that could not be
verified because its environment file or service was unavailable.
