/**
 * Seed bakery categories for the storefront showcase.
 * Prefer `npm run seed:catalog` for the full menu.
 * Safe to re-run — skips names that already exist.
 *
 * Usage: npx tsx scripts/seedCategories.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const categories = [
  { name: "Breads", description: "Soft sandwich loaves and everyday breads" },
  { name: "Buns", description: "Sweet and savoury buns fresh from the oven" },
  {
    name: "Cakes",
    description: "Classic Sri Lankan bakery cakes by the slab or whole",
  },
  { name: "Rolls", description: "Crispy rolls filled and fried to order" },
  { name: "Patties", description: "Golden short-eat patties for tea time" },
  { name: "Rotti", description: "Soft bakery rotti with classic fillings" },
  { name: "Pastries", description: "Flaky pastries and bakery short eats" },
  { name: "Sweets", description: "Tea-time sweets and soft bakery treats" },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let created = 0;
  let skipped = 0;

  for (const category of categories) {
    const { data: existing, error: lookupError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category.name)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existing) {
      skipped += 1;
      console.log(`skip  ${category.name}`);
      continue;
    }

    const { error } = await supabase.from("categories").insert({
      name: category.name,
      description: category.description,
      is_active: true,
    });

    if (error) {
      throw error;
    }

    created += 1;
    console.log(`add   ${category.name}`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
