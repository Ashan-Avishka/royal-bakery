"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ProductImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string | null;
  alt: string;
  fallbackLabel?: string;
};

export function ProductImage({ src, alt, fallbackLabel = "Photo unavailable", ...props }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div role="img" aria-label={`${alt} photo unavailable`} className="flex h-full w-full items-center justify-center bg-gradient-to-br from-honey-light via-cream to-honey/40 px-4 text-center">
        <span className="font-display text-sm tracking-wide text-text-muted">{fallbackLabel}</span>
      </div>
    );
  }
  return <Image {...props} src={src} alt={alt} onError={() => setFailed(true)} />;
}
