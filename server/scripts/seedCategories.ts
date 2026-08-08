/**
 * Seed bakery categories for the storefront showcase.
 * Safe to re-run — skips names that already exist.
 *
 * Usage: npx tsx scripts/seedCategories.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const categories = [
  { name: "Pastries", description: "Croissants, danishes, and flaky layers" },
  { name: "Breads", description: "Fresh loaves and rolls baked daily" },
  { name: "Cookies", description: "Crisp, chewy, and chocolate-packed favourites" },
  { name: "Sweets", description: "Donuts, muffins, and everyday treats" },
  { name: "Savouries", description: "Savoury bakes for any time of day" },
  { name: "Cupcakes", description: "Individual cakes finished with care" },
  { name: "Celebration", description: "Special-occasion centrepieces made to order" },
  { name: "Slices", description: "Tea-time slices and traybakes" },
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
