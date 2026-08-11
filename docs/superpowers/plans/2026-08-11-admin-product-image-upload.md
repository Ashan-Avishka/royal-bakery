# Admin Product Image Upload/Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admins a preview + drag-and-drop upload experience for a product's image, plus the ability to remove it, with old storage objects cleaned up on replace/remove.

**Architecture:** Backend: extend the existing multer → Supabase Storage → `products.image_url` pipeline with a storage-cleanup helper and a new `DELETE /admin/products/:id/image` route. Frontend: a new `ImageUploadField` client component replaces the bare `<input type="file">` in `ProductForm.tsx`, backed by the same hidden file input (so the existing `FormData`-based server actions need no changes), plus a small standalone remove action wired through its own server action.

**Tech Stack:** Express 5 + TypeScript (`server/`), Supabase JS v2 (Postgres + Storage), multer, vitest + supertest for backend tests. Next.js 16.2.10 (App Router) + React 19 + TypeScript (`client/`), Tailwind v4, vitest + @testing-library/react for frontend tests.

## Global Constraints

- Backend file upload limit: 5MB, `image/*` mimetypes only (`server/src/routes/adminCatalog.ts` multer config) — client-side validation must mirror these exact limits.
- Storage bucket name is the literal string `"product-images"` (`server/src/services/uploadService.ts`) — do not hardcode it a second time; reuse the existing `BUCKET` constant.
- Storage-delete failures must never fail the triggering request — log and continue (see design spec's Error Handling section).
- This repo's Next.js version has breaking changes vs. training data (see `client/AGENTS.md`). Before writing any Server Actions / `revalidatePath` code in Tasks 5–6, skim `node_modules/next/dist/docs/` for the current App Router Server Actions guidance rather than assuming prior-knowledge behavior.
- Frontend components follow the existing test convention: co-located `*.test.tsx` using `@testing-library/react` + vitest, `next/image`/`next/link` already globally mocked in `client/src/test/setup.ts`. `jsdom` has no `URL.createObjectURL`/`revokeObjectURL` — stub them per-test-file, not globally.
- No automated tests exist today for `client/src/lib/admin/catalog.ts` or `client/src/app/actions/admin/products.ts` (confirmed: no `catalog.test.ts`, no `admin/products.test.ts`) — follow that existing convention and don't introduce new test infra for those two files; verify them manually as part of Task 6's browser QA instead.

---

## Task 1: Storage cleanup in `uploadService`

**Files:**
- Modify: `server/src/services/uploadService.ts`
- Modify: `server/src/test/fakeSupabase.ts`
- Test: `server/src/services/uploadService.test.ts`

**Interfaces:**
- Produces: `deleteProductImage(imageUrl: string): Promise<void>` — new export. `uploadProductImage(productId: string, file: {buffer, mimetype, originalname}, previousImageUrl?: string | null): Promise<string>` — existing export, gains a third optional parameter.

- [ ] **Step 1: Write the failing tests**

Add to `server/src/services/uploadService.test.ts` (below the existing `describe("uploadProductImage", ...)` block):

```ts
import { deleteProductImage } from "./uploadService.js";

describe("deleteProductImage", () => {
  it("calls storage.remove with the path extracted from the public URL", async () => {
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: () => ({ remove }) },
    } as any);

    await deleteProductImage(
      `https://fake-storage.test/product-images/${PRODUCT_ID}/167-photo.png`
    );

    expect(remove).toHaveBeenCalledWith([`${PRODUCT_ID}/167-photo.png`]);
  });

  it("does nothing if the url doesn't contain the bucket segment", async () => {
    const remove = vi.fn();
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      storage: { from: () => ({ remove }) },
    } as any);

    await deleteProductImage("https://example.test/not-a-bucket-url.png");

    expect(remove).not.toHaveBeenCalled();
  });
});

describe("uploadProductImage cleanup", () => {
  it("deletes the previous image after a successful upload", async () => {
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    const fakeClient = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      ...fakeClient,
      storage: {
        from: (bucket: string) => ({ ...fakeClient.storage.from(bucket), remove }),
      },
    } as any);

    await uploadProductImage(
      PRODUCT_ID,
      { buffer: Buffer.from("x"), mimetype: "image/png", originalname: "new.png" },
      `https://fake-storage.test/product-images/${PRODUCT_ID}/old.png`
    );

    expect(remove).toHaveBeenCalledWith([`${PRODUCT_ID}/old.png`]);
  });

  it("does not attempt cleanup when there is no previous image", async () => {
    const remove = vi.fn();
    const fakeClient = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      ...fakeClient,
      storage: {
        from: (bucket: string) => ({ ...fakeClient.storage.from(bucket), remove }),
      },
    } as any);

    await uploadProductImage(PRODUCT_ID, {
      buffer: Buffer.from("x"),
      mimetype: "image/png",
      originalname: "new.png",
    });

    expect(remove).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npm test -- uploadService` (or `npx vitest run src/services/uploadService.test.ts`)
Expected: FAIL — `deleteProductImage` is not exported / `uploadProductImage` cleanup assertions fail (no cleanup call happens yet).

- [ ] **Step 3: Add `.remove()` to the fake Supabase storage mock**

In `server/src/test/fakeSupabase.ts`, inside `storage: { from(bucket) { return { ... } } }` (around line 316), add a `remove` method alongside the existing `upload`/`getPublicUrl`:

```ts
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, _body: unknown, _opts?: unknown) {
            return { data: { path }, error: null };
          },
          async remove(_paths: string[]) {
            return { data: null, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://fake-storage.test/${bucket}/${path}` } };
          },
        };
      },
    },
```

- [ ] **Step 4: Implement `deleteProductImage` and the cleanup parameter**

Replace the full contents of `server/src/services/uploadService.ts`:

```ts
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
  file: { buffer: Buffer; mimetype: string; originalname: string },
  previousImageUrl?: string | null
): Promise<string> {
  const path = `${productId}/${Date.now()}-${sanitizeFileName(file.originalname)}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) {
    throw new AppError(500, "Failed to upload product image", { cause: error });
  }

  if (previousImageUrl) {
    await deleteProductImage(previousImageUrl);
  }

  const { data } = getSupabaseAdmin().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  const path = extractStoragePath(imageUrl);
  if (!path) return;

  const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("Failed to delete product image from storage", error);
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd server && npm test -- uploadService`
Expected: PASS (all `uploadProductImage` and `deleteProductImage` tests green).

- [ ] **Step 6: Commit**

```bash
git add server/src/services/uploadService.ts server/src/test/fakeSupabase.ts server/src/services/uploadService.test.ts
git commit -m "feat(server): clean up old product image objects in storage"
```

---

## Task 2: `clearProductImage` in `catalogService`

**Files:**
- Modify: `server/src/services/catalogService.ts`
- Test: `server/src/services/catalogService.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `clearProductImage(id: string): Promise<Product>` — new export. `updateProduct`'s `fields.imageUrl` type widens from `string` to `string | null`.

- [ ] **Step 1: Write the failing test**

In `server/src/services/catalogService.test.ts`, add `clearProductImage` to the import list at the top (currently lines 9–20), and add this test inside the existing `describe("createProduct / updateProduct / setProductImage / deleteProduct", ...)` block, right after the `"sets the product image"` test:

```ts
  it("clears the product image", async () => {
    await setProductImage(PROD_A, "https://example.test/img.png");
    const product = await clearProductImage(PROD_A);
    expect(product.imageUrl).toBeNull();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && npm test -- catalogService`
Expected: FAIL — `clearProductImage` is not exported.

- [ ] **Step 3: Implement `clearProductImage` and widen the type**

In `server/src/services/catalogService.ts`:

1. Change line 176 from `imageUrl?: string;` to `imageUrl?: string | null;` (inside the `updateProduct` fields type).
2. Immediately after `setProductImage` (currently lines 201–203), add:

```ts
export async function clearProductImage(id: string): Promise<Product> {
  return updateProduct(id, { imageUrl: null });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && npm test -- catalogService`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/catalogService.ts server/src/services/catalogService.test.ts
git commit -m "feat(server): add clearProductImage to catalogService"
```

---

## Task 3: `DELETE /admin/products/:id/image` route + cleanup-on-replace

**Files:**
- Modify: `server/src/routes/adminCatalog.ts`
- Test: `server/src/routes/adminCatalog.test.ts`

**Interfaces:**
- Consumes: `deleteProductImage` (Task 1), `clearProductImage` (Task 2), existing `getProductById`, `uploadProductImage`.
- Produces: `DELETE /api/admin/products/:id/image` → `200 { product }` on success, `404` if the product doesn't exist, `400` if the product has no image set.

- [ ] **Step 1: Write the failing tests**

In `server/src/routes/adminCatalog.test.ts`, add these tests inside the `describe("admin products", ...)` block, after the `"rejects a non-image upload"` test:

```ts
  it("removes a product image", async () => {
    const app = createApp();
    await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("fake-png-bytes"), "photo.png");

    const res = await request(app)
      .delete(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(200);
    expect(res.body.product.imageUrl).toBeNull();
  });

  it("returns 400 removing an image from a product that has none", async () => {
    const app = createApp();
    const res = await request(app)
      .delete(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(400);
  });

  it("returns 404 removing an image from an unknown product", async () => {
    const app = createApp();
    const res = await request(app)
      .delete("/api/admin/products/99999999-9999-9999-9999-999999999999/image")
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(404);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npm test -- adminCatalog`
Expected: FAIL — no `DELETE .../image` route registered (404/wrong status on all three new tests).

- [ ] **Step 3: Implement the route and wire cleanup into the existing upload route**

In `server/src/routes/adminCatalog.ts`:

1. Update the import block (lines 7–19) to add `clearProductImage` to the `catalogService` import and `deleteProductImage` to the `uploadService` import:

```ts
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  setProductImage,
  clearProductImage,
  updateCategory,
  updateProduct,
} from "../services/catalogService.js";
import { deleteProductImage, uploadProductImage } from "../services/uploadService.js";
```

2. In the existing `POST /admin/products/:id/image` handler (currently lines 170–201), change the `uploadProductImage` call to pass the product's current image as the third argument:

```ts
      const imageUrl = await uploadProductImage(
        paramsParsed.data.id,
        {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        },
        existing.imageUrl
      );
```

3. After that handler's closing `);`, add the new route:

```ts
adminCatalogRouter.delete(
  "/admin/products/:id/image",
  async (req, res, next) => {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: { message: "Invalid product id" } });
      return;
    }

    try {
      const existing = await getProductById(paramsParsed.data.id);
      if (!existing) {
        next(new AppError(404, "Product not found"));
        return;
      }
      if (!existing.imageUrl) {
        next(new AppError(400, "Product has no image to remove"));
        return;
      }
      await deleteProductImage(existing.imageUrl);
      const product = await clearProductImage(paramsParsed.data.id);
      res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && npm test -- adminCatalog`
Expected: PASS.

- [ ] **Step 5: Run the full backend suite**

Run: `cd server && npm test`
Expected: PASS (no regressions in other route/service tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/adminCatalog.ts server/src/routes/adminCatalog.test.ts
git commit -m "feat(server): add DELETE /admin/products/:id/image route"
```

---

## Task 4: Frontend API client + server action for image removal

**Files:**
- Modify: `client/src/lib/admin/catalog.ts`
- Modify: `client/src/app/actions/admin/products.ts`

**Interfaces:**
- Consumes: `DELETE /api/admin/products/:id/image` (Task 3).
- Produces: `removeAdminProductImage(accessToken: string, id: string): Promise<Product>` (in `lib/admin/catalog.ts`). `removeProductImage(productId: string): Promise<void>` (in `app/actions/admin/products.ts`) — a `"use server"` action, importable from client components.

No automated test for this task — see Global Constraints. It's exercised end-to-end by Task 6's browser QA.

- [ ] **Step 1: Add `removeAdminProductImage`**

In `client/src/lib/admin/catalog.ts`, add after `uploadAdminProductImage` (after line 166):

```ts
export async function removeAdminProductImage(
  accessToken: string,
  id: string
): Promise<Product> {
  const { product } = await api<{ product: Product }>(
    `/api/admin/products/${id}/image`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return product;
}
```

- [ ] **Step 2: Add the `removeProductImage` server action**

In `client/src/app/actions/admin/products.ts`:

1. Add `removeAdminProductImage` to the import from `"@/lib/admin/catalog"` (line 6–11):

```ts
import {
  createAdminProduct,
  deleteAdminProduct,
  removeAdminProductImage,
  updateAdminProduct,
  uploadAdminProductImage,
} from "@/lib/admin/catalog";
```

2. Add this function after `deleteProduct` (after line 158, end of file):

```ts

export async function removeProductImage(productId: string): Promise<void> {
  const session = await requireAdminSession();
  try {
    await removeAdminProductImage(session.accessToken, productId);
  } catch (err) {
    throw err instanceof ApiError ? err : new Error("Failed to remove image.");
  }
  revalidateProducts(productId);
}
```

- [ ] **Step 3: Type-check**

Run: `cd client && npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/admin/catalog.ts client/src/app/actions/admin/products.ts
git commit -m "feat(client): add API client and server action for removing a product image"
```

---

## Task 5: `ImageUploadField` component

**Files:**
- Create: `client/src/components/admin/ImageUploadField.tsx`
- Test: `client/src/components/admin/ImageUploadField.test.tsx`

**Interfaces:**
- Consumes: `removeProductImage` (Task 4).
- Produces: `ImageUploadField({ productId?: string; initialImageUrl: string | null; disabled?: boolean })` — a `"use client"` component rendering a hidden `<input type="file" name="image">` (so it plugs into `ProductForm`'s existing `FormData` submission unchanged).

- [ ] **Step 1: Write the failing tests**

Create `client/src/components/admin/ImageUploadField.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUploadField } from "./ImageUploadField";

const mocks = vi.hoisted(() => ({
  removeProductImage: vi.fn(),
}));

vi.mock("@/app/actions/admin/products", () => ({
  removeProductImage: mocks.removeProductImage,
}));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeImageFile(name = "photo.png", type = "image/png", size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("ImageUploadField", () => {
  it("shows the empty dropzone when there is no existing image", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    expect(screen.getByText("Drag an image here, or click to browse")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Remove image" })).not.toBeInTheDocument();
  });

  it("shows the existing image and a remove button in edit mode", () => {
    render(
      <ImageUploadField
        productId="product-1"
        initialImageUrl="https://images.example.com/cake.jpg"
      />
    );
    expect(screen.getByAltText("Product image")).toHaveAttribute(
      "src",
      "https://images.example.com/cake.jpg"
    );
    expect(screen.getByRole("button", { name: "Remove image" })).toBeVisible();
  });

  it("stages a valid file and shows its preview and filename", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    const input = screen.getByLabelText("Product image") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeImageFile()] } });

    expect(screen.getByText("photo.png")).toBeVisible();
    expect(screen.getByAltText("photo.png")).toHaveAttribute("src", "blob:mock-preview");
  });

  it("rejects a non-image file with an inline error", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    const input = screen.getByLabelText("Product image") as HTMLInputElement;
    const badFile = new File(["hello"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [badFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Only image files are allowed.");
  });

  it("rejects a file over 5MB with an inline error", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    const input = screen.getByLabelText("Product image") as HTMLInputElement;
    const bigFile = makeImageFile("big.png", "image/png", 6 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Image must be 5MB or smaller.");
  });

  it("removes the existing image and hides the remove button on success", async () => {
    mocks.removeProductImage.mockResolvedValue(undefined);
    render(
      <ImageUploadField productId="product-1" initialImageUrl="https://images.example.com/cake.jpg" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

    await waitFor(() => {
      expect(mocks.removeProductImage).toHaveBeenCalledWith("product-1");
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Remove image" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Drag an image here, or click to browse")).toBeVisible();
  });

  it("shows an inline error when removing the image fails", async () => {
    mocks.removeProductImage.mockRejectedValue(new Error("Failed to remove image."));
    render(
      <ImageUploadField productId="product-1" initialImageUrl="https://images.example.com/cake.jpg" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to remove image.");
    expect(screen.getByRole("button", { name: "Remove image" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd client && npx vitest run src/components/admin/ImageUploadField.test.tsx`
Expected: FAIL — `./ImageUploadField` module doesn't exist yet.

- [ ] **Step 3: Implement the component**

Create `client/src/components/admin/ImageUploadField.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useId, useRef, useState, useTransition } from "react";
import { removeProductImage } from "@/app/actions/admin/products";
import { Button } from "@/components/ui/Button";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Only image files are allowed.";
  if (file.size > MAX_FILE_BYTES) return "Image must be 5MB or smaller.";
  return null;
}

export function ImageUploadField({
  productId,
  initialImageUrl,
  disabled = false,
}: {
  productId?: string;
  initialImageUrl: string | null;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removePending, startRemove] = useTransition();

  const hasExistingImage = Boolean(initialImageUrl) && !imageRemoved;
  const displayUrl = previewUrl ?? (hasExistingImage ? initialImageUrl : null);

  function stageFile(file: File) {
    const message = validateFile(file);
    if (message) {
      setValidationError(message);
      return;
    }
    setValidationError(null);
    setImageRemoved(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
  }

  function handleDrop(file: File | undefined) {
    if (!file || !inputRef.current) return;
    const message = validateFile(file);
    if (message) {
      setValidationError(message);
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    stageFile(file);
  }

  function handleRemove() {
    if (!productId) return;
    setRemoveError(null);
    startRemove(async () => {
      try {
        await removeProductImage(productId);
        setImageRemoved(true);
      } catch (err) {
        setRemoveError(err instanceof Error ? err.message : "Failed to remove image.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-cocoa">
        {hasExistingImage || previewUrl ? "Replace image" : "Product image"}
      </label>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (disabled) return;
          handleDrop(event.dataTransfer.files?.[0]);
        }}
        aria-disabled={disabled}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragActive ? "border-caramel bg-honey-light/40" : "border-border-warm bg-white"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {displayUrl ? (
          <div className="relative aspect-[16/9] w-full max-w-xs overflow-hidden rounded-lg bg-honey-light">
            <Image
              src={displayUrl}
              alt={fileName ?? "Product image"}
              fill
              className="object-cover"
              sizes="320px"
              unoptimized={Boolean(previewUrl)}
            />
          </div>
        ) : (
          <p className="text-sm text-text-muted">Drag an image here, or click to browse</p>
        )}
        {fileName && <p className="text-xs text-text-muted">{fileName}</p>}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        name="image"
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) stageFile(file);
        }}
        className="sr-only"
      />

      {validationError && (
        <p role="alert" className="text-xs text-red-600">
          {validationError}
        </p>
      )}

      {hasExistingImage && !previewUrl && productId && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || removePending}
            onClick={handleRemove}
            className="w-fit border-red-200 text-red-700 hover:bg-red-50"
          >
            {removePending ? "Removing…" : "Remove image"}
          </Button>
          {removeError && (
            <p role="alert" className="text-xs text-red-600">
              {removeError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd client && npx vitest run src/components/admin/ImageUploadField.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `cd client && npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/admin/ImageUploadField.tsx client/src/components/admin/ImageUploadField.test.tsx
git commit -m "feat(client): add ImageUploadField with preview, drag-and-drop, and remove"
```

---

## Task 6: Wire `ImageUploadField` into `ProductForm`, remove the duplicate image block, browser QA

**Files:**
- Modify: `client/src/components/admin/ProductForm.tsx`
- Modify: `client/src/app/(admin)/admin/products/[id]/page.tsx`

**Interfaces:**
- Consumes: `ImageUploadField` (Task 5).

- [ ] **Step 1: Replace the raw file input in `ProductForm.tsx`**

In `client/src/components/admin/ProductForm.tsx`:

1. Add the import (after line 10, alongside the other `@/components` imports):

```tsx
import { ImageUploadField } from "@/components/admin/ImageUploadField";
```

2. Replace the entire image block (lines 102–119: the `<div className="flex flex-col gap-1.5">...</div>` containing the `label` and file `input`) with:

```tsx
      <ImageUploadField
        productId={product?.id}
        initialImageUrl={product?.imageUrl ?? null}
        disabled={pending}
      />
```

- [ ] **Step 2: Remove the now-duplicate image preview from the edit page**

In `client/src/app/(admin)/admin/products/[id]/page.tsx`, `ImageUploadField` already shows the current image inside the form, so the standalone preview above it is redundant. Remove lines 58–68:

```tsx
      {product.imageUrl && (
        <div className="relative mb-8 aspect-[16/9] max-w-md overflow-hidden rounded-xl bg-honey-light">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="448px"
          />
        </div>
      )}

```

Then remove the now-unused `import Image from "next/image";` (line 1), since that was its only use in this file.

- [ ] **Step 3: Run the full frontend test suite**

Run: `cd client && npm test`
Expected: PASS, including `client/src/components/admin/FormFeedback.test.tsx` (which mounts `<ProductForm categories={[]} />` in create mode — must keep passing unchanged) and `client/src/app/(admin)/admin/products/[id]` route tests if any exist.

- [ ] **Step 4: Type-check and lint**

Run: `cd client && npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 5: Manual browser QA**

Run: `cd server && npm run dev` (in one terminal) and `cd client && npm run dev` (in another), then in a browser at the admin products section:

1. Open "New product" — confirm the dropzone shows "Drag an image here, or click to browse", click it, pick an image file, confirm a preview and filename appear, submit, confirm the created product shows the uploaded image.
2. Open that product's edit page — confirm the existing image renders inside the dropzone with a "Remove image" button beside it, and the label reads "Replace image".
3. Drag a new image file onto the dropzone — confirm the preview updates to the new file and a drag-over highlight appears while dragging.
4. Click "Remove image" — confirm it shows "Removing…", then the dropzone returns to its empty state with no "Remove image" button.
5. Try uploading a non-image file (e.g. a `.txt` renamed to look droppable) and a file over 5MB — confirm each shows its inline error and does not get staged.
6. Save the form after replacing an image — confirm in Supabase Storage (or via the returned `imageUrl`) that the old object was deleted and only the new one remains.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/admin/ProductForm.tsx "client/src/app/(admin)/admin/products/[id]/page.tsx"
git commit -m "feat(client): wire ImageUploadField into the product form"
```
