"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { addToCart } from "@/app/actions/cart";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, type Product } from "@/lib/catalog";

const WISHLIST_KEY = "royal-bakery-wishlist";
const WISHLIST_CHANGE_EVENT = "royal-bakery-wishlist-change";
const DEFAULT_PRODUCT_IMAGE_SIZES =
  "(min-width: 1280px) 264px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 2rem)";

function readWishlist(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeWishlist(ids: Set<string>) {
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
}

function subscribeToWishlist(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(WISHLIST_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(WISHLIST_CHANGE_EVENT, onChange);
  };
}

function AddToCartButton({ outOfStock }: { outOfStock: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={outOfStock || pending}
      title={outOfStock ? "Out of stock" : "Add to cart"}
      aria-label={outOfStock ? "Out of stock" : "Add to cart"}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-semibold tracking-[0.08em] transition-colors duration-300 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-45 ${
        outOfStock
          ? "bg-border-warm text-text-muted"
          : "bg-cocoa text-cream-alt hover:bg-caramel"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
        <path d="M3 3h2l2.4 11.2a2 2 0 002 1.6h7.4a2 2 0 001.9-1.4L21 8H7" />
      </svg>
      {pending ? "…" : "Add"}
    </button>
  );
}

export function ProductCard({
  product,
  priority = false,
  sizes = DEFAULT_PRODUCT_IMAGE_SIZES,
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const outOfStock = product.stockQuantity <= 0 || !product.isAvailable;
  const loved = useSyncExternalStore(
    subscribeToWishlist,
    () => readWishlist().has(product.id),
    () => false
  );

  const toggleLove = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = readWishlist();
    if (next.has(product.id)) {
      next.delete(product.id);
    } else {
      next.add(product.id);
    }
    writeWishlist(next);
  };

  const description =
    product.description?.trim() ||
    "Fresh from the oven, made in small batches.";

  return (
    <article className="product-card group relative h-full">
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-honey/40 via-caramel/10 to-transparent opacity-0 blur-xl"
        aria-hidden
      />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-cream-alt shadow-[0_12px_32px_-20px_rgba(58,26,19,0.28)] ring-1 ring-border-warm/80">
        <div className="relative aspect-square overflow-hidden">
          <Link
            href={`/products/${product.id}`}
            className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-caramel/40"
            aria-label={`View ${product.name}`}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority={priority}
                sizes={sizes}
                className="object-cover transition-transform duration-500 motion-reduce:transition-none"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-honey-light via-cream to-honey/40 px-4 text-center">
                <span className="font-display text-sm tracking-wide text-text-muted">
                  Photo coming soon
                </span>
              </div>
            )}
          </Link>

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa-dark/50 via-transparent to-cocoa-dark/10"
            aria-hidden
          />

          <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLove}
              aria-label={loved ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={loved}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-alt/95 text-text-muted shadow-sm backdrop-blur-sm transition-colors duration-300 motion-reduce:transition-none"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={loved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-colors duration-300 ${
                  loved ? "text-red-500" : "text-text-muted"
                }`}
                aria-hidden
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-3 left-3 z-10 rounded-full bg-cream-alt/95 px-3 py-1 text-[12px] font-semibold tracking-wide text-cocoa shadow-sm backdrop-blur-sm">
            {formatPrice(product.price)}
          </div>

          {outOfStock && (
            <Badge
              tone="warning"
              className="absolute bottom-3 right-3 z-10 border border-amber-200/60 backdrop-blur-sm"
            >
              Sold out
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 px-4 py-4">
          <Link
            href={`/products/${product.id}`}
            className="outline-none focus-visible:underline focus-visible:decoration-caramel"
          >
            <h3
              className="font-display text-lg font-semibold leading-snug text-cocoa"
            >
              {product.name}
            </h3>
          </Link>

          <p className="line-clamp-2 font-display text-[12px] italic leading-relaxed text-text-muted">
            {description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <Link
              href={`/products/${product.id}`}
              className="text-[11px] font-medium tracking-[0.12em] text-caramel transition-colors hover:text-caramel-hover"
            >
              Details
            </Link>
            <form action={addToCart}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="quantity" value={1} />
              <AddToCartButton outOfStock={outOfStock} />
            </form>
          </div>
        </div>
      </div>
    </article>
  );
}
