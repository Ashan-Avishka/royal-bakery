# Admin Product Image Upload/Edit — Design

## Context

Product image upload already exists end-to-end: `POST /admin/products/:id/image` (multer → `uploadService.uploadProductImage` → Supabase Storage bucket `product-images` → `catalogService.setProductImage` sets `products.image_url`). It's wired into `ProductForm.tsx` via a bare `<input type="file">`.

What's missing:
- No preview of the selected file or the existing saved image.
- No drag-and-drop; a native file picker only.
- No way to remove an image — only replace-by-upload.
- Replacing or removing an image never deletes the old object from storage, so orphaned files accumulate in the bucket over time.

## Scope

Single image per product (existing `image_url` column, no schema change). Improve the upload/edit UX in the create/edit admin form only (`ProductForm.tsx`). No multi-image gallery, no client-side crop.

## Backend changes

### `server/src/services/uploadService.ts`
- Add `deleteProductImage(imageUrl: string): Promise<void>` — parses the storage path out of the public URL (split on `/product-images/`) and calls `.storage.from('product-images').remove([path])`.
- Update `uploadProductImage(productId, file, previousImageUrl?)` to accept the product's current `imageUrl`. After the new file uploads successfully, delete the previous object (if any). Upload-then-delete ordering ensures a failed upload never leaves the product imageless.
- Storage-delete failures are logged and swallowed, never surfaced as a request failure — the DB is already correct at that point, so a leftover orphaned file is a non-critical miss, not a user-facing error.

### `server/src/services/catalogService.ts`
- Widen the `imageUrl` field on the update-fields type from `string` to `string | null` so a clear operation can flow through the existing `updateProduct`.
- Add `clearProductImage(id: string): Promise<Product>` → `updateProduct(id, { imageUrl: null })`.

### `server/src/routes/adminCatalog.ts`
- Update the existing `POST /admin/products/:id/image` handler to pass `existing.imageUrl` into `uploadProductImage` so replacing an image cleans up the old file.
- Add `DELETE /admin/products/:id/image`: loads the product (404 if missing), 400s if it has no `imageUrl` set, deletes the storage object via `deleteProductImage`, calls `clearProductImage`, returns the updated product. Same `requireAuth` + `requireRole("admin")` guard as the rest of `/admin/products`.

## Frontend changes

### `client/src/lib/admin/catalog.ts`
- Add `removeAdminProductImage(accessToken, id): Promise<Product>` calling the new `DELETE /api/admin/products/:id/image`.

### `client/src/app/actions/admin/products.ts`
- Add `removeProductImage(productId: string): Promise<void>` server action, mirroring the existing `deleteProduct` action: calls `removeAdminProductImage`, then `revalidateProducts(productId)`.

### `client/src/components/admin/ImageUploadField.tsx` (new client component)
Replaces the raw `<input type="file">` block in `ProductForm.tsx`. Props: `productId?: string` (edit mode only), `initialImageUrl: string | null`, `disabled?: boolean` (bound to the parent form's `pending` state).

- Drag-and-drop zone + click-to-browse, backed by a hidden `<input type="file" name="image" accept="image/*">` so the field still submits through the existing `FormData`-based server actions unchanged.
- Client-side validation mirrors the backend: `image/*` only, 5MB max. Rejected files show inline error text and are never staged into the hidden input.
- Preview: the newly staged file (via `URL.createObjectURL`, revoked on unmount/replace) if one is selected; otherwise the product's existing `imageUrl` in edit mode, rendered with `next/image`.
- "Remove image" button — shown only in edit mode, when an image exists and no new file is staged. Removing is destructive and independent of the rest of the form; since a `<form>` can't nest inside `ProductForm`'s own `<form>`, this is a plain button that calls `removeProductImage` directly via `startTransition` (not through `ProductForm`'s `useActionState`), with its own local pending/error state. On success, the local preview clears and the parent path revalidates.

### `client/src/components/admin/ProductForm.tsx`
- Replace the current image `<label>` + `<input type="file">` block (lines 102–119) with `<ImageUploadField productId={product?.id} initialImageUrl={product?.imageUrl ?? null} disabled={pending} />`.

## Data flow

- **Create**: unchanged — product is created first, then if a file was staged in `ImageUploadField`, the existing post-create upload call fires (no previous image to clean up).
- **Edit — replace**: new file staged → form submit uploads it → server deletes the old storage object → DB `image_url` updated to the new URL.
- **Edit — remove**: "Remove image" button → `removeProductImage` action → server deletes the storage object and clears `image_url` → component re-renders with an empty dropzone, independent of whether the rest of the form is saved.

## Error handling

- Client-side file validation (type/size) blocks staging and shows inline text — no network round trip for a file that's already invalid.
- Server-side validation (multer `fileFilter`, 5MB `limits`) remains the source of truth and is unchanged.
- Remove-image errors surface inline near the button (small red text), not as a full-page/form failure, since it's a separate action from the main save.
- Storage cleanup (deleting the old/removed object) never fails the user-facing request — see backend section.

## Testing

- Extend `server/src/routes/adminCatalog.test.ts`: new `DELETE /admin/products/:id/image` route (success, 404 for missing product, 400 for no existing image), and cleanup-on-replace behavior for the existing `POST .../image` route.
- Extend the Supabase test fake (used across `catalogService.test.ts` / `adminCatalog.test.ts`) to support `.storage.from(...).remove(...)`.
- No existing automated test infra covers admin form UI in this repo; drag-and-drop, preview, and remove will be verified manually in-browser, consistent with how the rest of the admin UI is currently tested.
