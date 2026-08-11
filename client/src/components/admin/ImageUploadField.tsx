"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { removeProductImage } from "@/app/actions/admin/products";
import { Button } from "@/components/ui/Button";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Only image files are allowed.";
  if (file.size > MAX_FILE_BYTES) return "Image must be 5MB or smaller.";
  return null;
}

// Clears a file input so nothing invalid/stale can be submitted. `.value =
// ""` is the standards-compliant way to empty a file input's FileList, but
// some testing harnesses shadow `.files` with a plain writable property
// that decouples it from `.value` -- so we also reassign `.files` directly
// (using an empty DataTransfer's FileList where available) as a belt-and-
// braces measure.
function clearFileInput(input: HTMLInputElement | null) {
  if (!input) return;
  input.value = "";
  try {
    input.files =
      typeof DataTransfer !== "undefined"
        ? new DataTransfer().files
        : ([] as unknown as FileList);
  } catch {
    // Native, non-shadowed `.files` setters in some environments reject
    // this; `.value = ""` above already cleared it there.
  }
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
  const [prevInitialImageUrl, setPrevInitialImageUrl] = useState(initialImageUrl);

  // When the parent re-renders with a fresh `initialImageUrl` (e.g. after a
  // successful save triggers revalidation), any locally-staged file is now
  // stale: the server already has the new image, so clear staged state so a
  // later, unrelated save doesn't silently re-submit and re-upload the same
  // file again. Adjusted during render (React's recommended pattern for
  // resetting state in response to a prop change) rather than in an effect,
  // so it doesn't trigger an extra commit.
  if (initialImageUrl !== prevInitialImageUrl) {
    setPrevInitialImageUrl(initialImageUrl);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName(null);
    setValidationError(null);
  }

  const hasExistingImage = Boolean(initialImageUrl) && !imageRemoved;
  const displayUrl = previewUrl ?? (hasExistingImage ? initialImageUrl : null);

  // The hidden input's `.files` is external DOM state, not React state, so
  // clearing it belongs in an effect: it stays in sync with the staged-file
  // reset above whenever `initialImageUrl` changes.
  useEffect(() => {
    clearFileInput(inputRef.current);
  }, [initialImageUrl]);

  // Single source of truth for "does this file get staged or rejected."
  // On rejection, clear the hidden input (and any stale preview) so an
  // invalid file can never be what actually gets submitted.
  function stageFile(file: File) {
    const message = validateFile(file);
    if (message) {
      setValidationError(message);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFileName(null);
      clearFileInput(inputRef.current);
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
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    stageFile(file);
  }

  function handleRemove() {
    if (!productId) return;
    setRemoveError(null);
    startRemove(async () => {
      const result = await removeProductImage(productId);
      if (result.error) {
        setRemoveError(result.error);
      } else {
        setImageRemoved(true);
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
