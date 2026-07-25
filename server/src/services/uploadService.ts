import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";

const BUCKET = "product-images";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadProductImage(
  productId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> {
  const path = `${productId}/${Date.now()}-${sanitizeFileName(file.originalname)}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) {
    throw new AppError(500, "Failed to upload product image", { cause: error });
  }

  const { data } = getSupabaseAdmin().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
