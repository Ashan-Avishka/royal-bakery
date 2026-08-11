/**
 * Seed the Royal Bakery catalog: 8 active categories + products.
 * Safe to re-run — upserts by category/product name.
 *
 * Usage: npx tsx scripts/seedCatalog.ts
 */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_ALIASES } from "./catalogAliases.js";

interface SeedCategory {
  name: string;
  description: string;
}

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
}

const ACTIVE_CATEGORIES: SeedCategory[] = [
  {
    name: "Breads",
    description: "Soft sandwich loaves and everyday breads",
  },
  {
    name: "Buns",
    description: "Sweet and savoury buns fresh from the oven",
  },
  {
    name: "Cakes",
    description: "Classic Sri Lankan cakes by slab or whole",
  },
  {
    name: "Rolls",
    description: "Crispy rolls filled and fried to order",
  },
  {
    name: "Patties",
    description: "Golden short-eat patties for tea time",
  },
  {
    name: "Rotti",
    description: "Soft bakery rotti with classic fillings",
  },
  {
    name: "Pastries",
    description: "Flaky pastries and bakery short eats",
  },
  {
    name: "Sweets",
    description: "Tea-time sweets and soft bakery treats",
  },
];

const PRODUCTS_BY_CATEGORY: Record<string, SeedProduct[]> = {
  Breads: [
    {
      name: "Sandwich Bread",
      description: "Soft sliced loaf — ideal for sandwiches and breakfast toast.",
      price: 280,
      stockQuantity: 24,
    },
    {
      name: "Normal Bread",
      description: "Everyday bakery bread with a light crust and soft crumb.",
      price: 220,
      stockQuantity: 30,
    },
    {
      name: "Milk Bread",
      description: "Slightly sweet milk loaf — soft, fluffy, and family favourite.",
      price: 260,
      stockQuantity: 20,
    },
  ],
  Buns: [
    {
      name: "Kimbula Buns",
      description: "Classic crocodile-shaped bun with a soft sweet dough.",
      price: 90,
      stockQuantity: 40,
    },
    {
      name: "Seeni Buns",
      description: "Soft bun filled with caramelised seeni sambol.",
      price: 100,
      stockQuantity: 40,
    },
    {
      name: "Fish Buns",
      description: "Savoury bun stuffed with seasoned fish filling.",
      price: 120,
      stockQuantity: 36,
    },
    {
      name: "Jam Buns",
      description: "Sweet bun finished with a bright jam centre.",
      price: 90,
      stockQuantity: 40,
    },
    {
      name: "Seeni Sambal Buns",
      description: "Soft bun packed with spicy-sweet seeni sambol.",
      price: 110,
      stockQuantity: 36,
    },
    {
      name: "Cream Buns",
      description: "Fluffy bun filled with light vanilla cream.",
      price: 100,
      stockQuantity: 40,
    },
    {
      name: "Tea Buns",
      description: "Simple sweet bun — perfect with evening tea.",
      price: 80,
      stockQuantity: 45,
    },
    {
      name: "Sausage Buns",
      description: "Soft bun wrapped around a savoury sausage filling.",
      price: 140,
      stockQuantity: 32,
    },
  ],
  Cakes: [
    {
      name: "Butter Cake",
      description: "Classic butter cake — soft crumb and rich flavour.",
      price: 1200,
      stockQuantity: 10,
    },
    {
      name: "Chocolate Cake",
      description: "Moist chocolate cake for celebrations and tea tables.",
      price: 1500,
      stockQuantity: 10,
    },
    {
      name: "Ribbon Cake",
      description: "Layered ribbon cake with colourful sponge stripes.",
      price: 1600,
      stockQuantity: 8,
    },
    {
      name: "Coconut Cake",
      description: "Soft coconut cake finished with fresh grated coconut notes.",
      price: 1400,
      stockQuantity: 10,
    },
  ],
  Rolls: [
    {
      name: "Egg Rolls",
      description: "Crispy roll filled with spiced egg mixture.",
      price: 120,
      stockQuantity: 40,
    },
    {
      name: "Veg Rolls",
      description: "Golden roll stuffed with seasoned mixed vegetables.",
      price: 110,
      stockQuantity: 40,
    },
    {
      name: "Fish Rolls",
      description: "Crispy fish-filled roll — a bakery short-eat classic.",
      price: 130,
      stockQuantity: 40,
    },
    {
      name: "Chicken Rolls",
      description: "Crispy roll with lightly spiced chicken filling.",
      price: 140,
      stockQuantity: 36,
    },
  ],
  Patties: [
    {
      name: "Egg Pattie",
      description: "Flaky pastry shell with a warm egg filling.",
      price: 100,
      stockQuantity: 36,
    },
    {
      name: "Fish Pattie",
      description: "Golden pattie filled with seasoned fish.",
      price: 120,
      stockQuantity: 36,
    },
    {
      name: "Veg Pattie",
      description: "Crisp pastry pocket with mixed vegetable filling.",
      price: 100,
      stockQuantity: 36,
    },
  ],
  Rotti: [
    {
      name: "Veg Rotti",
      description: "Soft bakery rotti wrapped around a vegetable filling.",
      price: 130,
      stockQuantity: 30,
    },
    {
      name: "Fish Rotti",
      description: "Warm fish-filled rotti — hearty and freshly baked.",
      price: 150,
      stockQuantity: 30,
    },
    {
      name: "Egg Rotti",
      description: "Soft rotti with a classic egg filling.",
      price: 140,
      stockQuantity: 30,
    },
  ],
  Pastries: [
    {
      name: "Fish Pastry",
      description: "Flaky pastry parcel filled with spiced fish.",
      price: 130,
      stockQuantity: 28,
    },
    {
      name: "Chicken Pastry",
      description: "Buttery pastry with a savoury chicken filling.",
      price: 140,
      stockQuantity: 28,
    },
    {
      name: "Vegetable Pastry",
      description: "Light pastry filled with seasoned vegetables.",
      price: 120,
      stockQuantity: 28,
    },
  ],
  Sweets: [
    {
      name: "Jam Tart",
      description: "Crisp tart shell finished with sweet jam.",
      price: 90,
      stockQuantity: 40,
    },
    {
      name: "Cream Doughnut",
      description: "Soft doughnut filled with vanilla cream.",
      price: 120,
      stockQuantity: 30,
    },
    {
      name: "Chocolate Muffin",
      description: "Moist chocolate muffin for a quick sweet bite.",
      price: 150,
      stockQuantity: 28,
    },
  ],
};

/** Older messy names → canonical product names */
async function ensureCategory(
  supabase: SupabaseClient,
  category: SeedCategory
): Promise<string> {
  const { data: existing, error: lookupError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", category.name)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing) {
    const { error } = await supabase
      .from("categories")
      .update({
        name: category.name,
        description: category.description,
        is_active: true,
      })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`cat  update  ${category.name}`);
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: category.name,
      description: category.description,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  console.log(`cat  create  ${category.name}`);
  return data.id as string;
}

async function deactivateOtherCategories(
  supabase: SupabaseClient,
  keepNames: string[]
) {
  const { data: all, error } = await supabase
    .from("categories")
    .select("id,name,is_active");
  if (error) throw error;

  const keep = new Set(keepNames.map((n) => n.toLowerCase()));
  for (const row of all ?? []) {
    if (keep.has(row.name.toLowerCase())) continue;
    if (!row.is_active) continue;
    const { error: updateError } = await supabase
      .from("categories")
      .update({ is_active: false })
      .eq("id", row.id);
    if (updateError) throw updateError;
    console.log(`cat  hide    ${row.name}`);
  }
}

async function findProductByNames(
  supabase: SupabaseClient,
  names: string[]
): Promise<{ id: string; name: string } | null> {
  for (const name of names) {
    const { data, error } = await supabase
      .from("products")
      .select("id,name")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as { id: string; name: string };
  }
  return null;
}

async function upsertProduct(
  supabase: SupabaseClient,
  categoryId: string,
  product: SeedProduct
) {
  const aliasKeys = Object.entries(PRODUCT_ALIASES)
    .filter(([, canonical]) => canonical.toLowerCase() === product.name.toLowerCase())
    .map(([alias]) => alias);

  const existing = await findProductByNames(supabase, [
    product.name,
    ...aliasKeys,
  ]);

  const payload = {
    name: product.name,
    description: product.description,
    price: product.price,
    category_id: categoryId,
    stock_quantity: product.stockQuantity,
    is_available: true,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`prod update  ${product.name}`);
    return;
  }

  const { error } = await supabase.from("products").insert(payload);
  if (error) throw error;
  console.log(`prod create  ${product.name}`);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const categoryIds = new Map<string, string>();
  for (const category of ACTIVE_CATEGORIES) {
    const id = await ensureCategory(supabase, category);
    categoryIds.set(category.name, id);
  }

  await deactivateOtherCategories(
    supabase,
    ACTIVE_CATEGORIES.map((c) => c.name)
  );

  for (const [categoryName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const categoryId = categoryIds.get(categoryName);
    if (!categoryId) {
      throw new Error(`Missing category id for ${categoryName}`);
    }
    for (const product of products) {
      await upsertProduct(supabase, categoryId, product);
    }
  }

  console.log("\nDone. Catalog seeded with 8 active categories.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
