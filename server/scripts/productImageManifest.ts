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
