import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";

const BUCKET = "product-images";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
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

// Storage-delete failures must never fail the triggering request: catch both
// a `{ error }` return AND a thrown exception (@supabase/storage-js throws
// for anything that isn't a StorageError, e.g. a network exception).
export async function deleteProductImage(imageUrl: string): Promise<void> {
  const path = extractStoragePath(imageUrl);
  if (!path) return;

  try {
    const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([path]);
    if (error) {
      console.error("Failed to delete product image from storage", error);
    }
  } catch (err) {
    console.error("Failed to delete product image from storage", err);
  }
}
