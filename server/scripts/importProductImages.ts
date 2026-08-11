import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  PRODUCT_IMAGE_MANIFEST,
  type ProductImageMapping,
  validateManifest,
} from "./productImageManifest.js";

interface CatalogProduct {
  id: string;
  name: string;
}

interface CatalogProductWithImageUrl extends CatalogProduct {
  imageUrl: string | null;
}

export type ImageImportTarget = "local" | "hosted" | "all";

export interface ImageImportArguments {
  target: ImageImportTarget;
  execute: boolean;
  verify: boolean;
}

export interface TargetEnvironmentFile {
  name: Exclude<ImageImportTarget, "all">;
  fileName: ".env.local" | ".env.hosted.local";
}

interface TargetImportDependencies extends ImportDependencies {
  listProductsForVerification(): Promise<readonly CatalogProductWithImageUrl[]>;
}

export interface ImportDependencies {
  readSource(sourcePath: string): Promise<Buffer>;
  convertToWebp(input: Buffer): Promise<Buffer>;
  listProducts(): Promise<readonly CatalogProduct[]>;
  upload(objectPath: string, webpBuffer: Buffer, contentType: string): Promise<void>;
  publicUrl(objectPath: string): string;
  updateImageUrl(productId: string, imageUrl: string): Promise<void>;
}

export interface ImportOptions {
  sourceDirectory: string;
  execute: boolean;
  environmentName: string;
}

export interface ImportFailure {
  productName: string;
  message: string;
}

export interface ImportReport {
  environmentName: string;
  validated: number;
  uploaded: number;
  updated: number;
  failures: ImportFailure[];
}

export async function convertToWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();
}

function normalizeProductName(name: string): string {
  return name.trim().toLocaleLowerCase("en");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function importProductImages(
  options: ImportOptions,
  dependencies: ImportDependencies,
  mappings: readonly ProductImageMapping[] = PRODUCT_IMAGE_MANIFEST
): Promise<ImportReport> {
  if (mappings === PRODUCT_IMAGE_MANIFEST) {
    await validateManifest(options.sourceDirectory);
  }

  const productsByName = new Map<string, CatalogProduct[]>();
  for (const product of await dependencies.listProducts()) {
    const normalizedName = normalizeProductName(product.name);
    const matchingProducts = productsByName.get(normalizedName) ?? [];
    matchingProducts.push(product);
    productsByName.set(normalizedName, matchingProducts);
  }

  const resolvedMappings = mappings.map((mapping) => {
    const matches = productsByName.get(normalizeProductName(mapping.productName)) ?? [];
    if (matches.length === 0) {
      throw new Error(`No catalog product found for "${mapping.productName}"`);
    }
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one catalog product for "${mapping.productName}", found ${matches.length}`
      );
    }
    return { mapping, product: matches[0] };
  });

  const report: ImportReport = {
    environmentName: options.environmentName,
    validated: resolvedMappings.length,
    uploaded: 0,
    updated: 0,
    failures: [],
  };

  for (const { mapping, product } of resolvedMappings) {
    try {
      const source = await dependencies.readSource(path.join(options.sourceDirectory, mapping.fileName));
      const webpBuffer = await dependencies.convertToWebp(source);
      if (!options.execute) {
        continue;
      }

      const objectPath = `${product.id}/catalog.webp`;
      await dependencies.upload(objectPath, webpBuffer, "image/webp");
      report.uploaded += 1;

      const imageUrl = dependencies.publicUrl(objectPath);
      await dependencies.updateImageUrl(product.id, imageUrl);
      report.updated += 1;
    } catch (error) {
      report.failures.push({ productName: mapping.productName, message: errorMessage(error) });
    }
  }

  return report;
}

function createImportDependencies(url: string, key: string): TargetImportDependencies {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    readSource: readFile,
    convertToWebp,
    async listProducts() {
      const { data, error } = await supabase.from("products").select("id, name");
      if (error) {
        throw error;
      }
      return data;
    },
    async listProductsForVerification() {
      const { data, error } = await supabase.from("products").select("id, name, image_url");
      if (error) {
        throw error;
      }
      return data.map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.image_url,
      }));
    },
    async upload(objectPath, webpBuffer, contentType) {
      const { error } = await supabase.storage.from("product-images").upload(objectPath, webpBuffer, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) {
        throw error;
      }
    },
    publicUrl(objectPath) {
      return supabase.storage.from("product-images").getPublicUrl(objectPath).data.publicUrl;
    },
    async updateImageUrl(productId, imageUrl) {
      const { error } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", productId);
      if (error) {
        throw error;
      }
    },
  };
}

export function parseArguments(arguments_: readonly string[]): ImageImportArguments {
  let target: ImageImportTarget | undefined;
  let execute = false;
  let verify = false;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--target") {
      if (target !== undefined || index + 1 >= arguments_.length) {
        throw new Error("Target must be local, hosted, or all");
      }
      const targetValue = arguments_[index + 1];
      if (targetValue !== "local" && targetValue !== "hosted" && targetValue !== "all") {
        throw new Error("Target must be local, hosted, or all");
      }
      target = targetValue;
      index += 1;
    } else if (argument === "--execute" && !execute) {
      execute = true;
    } else if (argument === "--verify" && !verify) {
      verify = true;
    } else {
      throw new Error("Usage: --target local|hosted|all [--execute] [--verify]");
    }
  }

  if (target === undefined) {
    throw new Error("Target must be local, hosted, or all");
  }

  return { target, execute, verify };
}

export function targetEnvironmentFiles(target: ImageImportTarget): readonly TargetEnvironmentFile[] {
  if (target === "local") {
    return [{ name: "local", fileName: ".env.local" }];
  }
  if (target === "hosted") {
    return [{ name: "hosted", fileName: ".env.hosted.local" }];
  }
  return [
    { name: "local", fileName: ".env.local" },
    { name: "hosted", fileName: ".env.hosted.local" },
  ];
}

export async function verifyProductImageUrls(
  products: readonly CatalogProductWithImageUrl[],
  mappings: readonly ProductImageMapping[] = PRODUCT_IMAGE_MANIFEST
): Promise<void> {
  const productsByName = new Map<string, CatalogProductWithImageUrl[]>();
  for (const product of products) {
    const normalizedName = normalizeProductName(product.name);
    const matchingProducts = productsByName.get(normalizedName) ?? [];
    matchingProducts.push(product);
    productsByName.set(normalizedName, matchingProducts);
  }

  await Promise.all(mappings.map(async (mapping) => {
    const matches = productsByName.get(normalizeProductName(mapping.productName)) ?? [];
    if (matches.length === 0) {
      throw new Error(`No catalog product found for "${mapping.productName}"`);
    }
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one catalog product for "${mapping.productName}", found ${matches.length}`
      );
    }

    const product = matches[0];
    const expectedPath = `/${product.id}/catalog.webp`;
    if (!product.imageUrl?.endsWith(expectedPath)) {
      throw new Error(`Product "${product.name}" image URL must end in "${expectedPath}"`);
    }

    const response = await fetch(product.imageUrl);
    if (response.status !== 200) {
      throw new Error(`Product "${product.name}" image URL returned HTTP ${response.status}`);
    }
    if (!response.headers.get("content-type")?.includes("image/webp")) {
      throw new Error(`Product "${product.name}" image URL did not return image/webp`);
    }
  }));
}

function clearTargetEnvironment(): void {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createTargetImportDependencies(environmentFile: TargetEnvironmentFile): TargetImportDependencies {
  clearTargetEnvironment();
  const configuration = dotenv.config({
    path: path.resolve(scriptDirectory, "..", environmentFile.fileName),
    override: true,
  });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  clearTargetEnvironment();

  if (configuration.error) {
    throw new Error(`Unable to load environment file "${environmentFile.fileName}"`);
  }
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createImportDependencies(url, key);
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(scriptDirectory, "../../System/assets/products");

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const run = async () => {
    const arguments_ = parseArguments(process.argv.slice(2));
    for (const environmentFile of targetEnvironmentFiles(arguments_.target)) {
      const dependencies = createTargetImportDependencies(environmentFile);
      const report = await importProductImages(
        {
          sourceDirectory,
          execute: arguments_.execute,
          environmentName: environmentFile.name,
        },
        dependencies
      );
      if (arguments_.verify) {
        await verifyProductImageUrls(await dependencies.listProductsForVerification());
      }
      console.log(JSON.stringify(report, null, 2));
      if (report.failures.length > 0) {
        process.exitCode = 1;
      }
    }
  };

  run().catch((error: unknown) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
