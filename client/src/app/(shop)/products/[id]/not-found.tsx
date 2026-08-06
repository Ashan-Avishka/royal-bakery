import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="bg-cream">
      <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center px-6 py-16">
        <section className="w-full border-y border-border-warm py-12 text-center">
          <h1 className="text-balance font-display text-3xl font-semibold text-cocoa sm:text-4xl">
            Product not found
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-7 text-text-muted">
            This product may no longer be available or the link may be incorrect.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cocoa px-5 py-2.5 text-sm font-semibold text-cream-alt transition-colors hover:bg-cocoa-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to all products
          </Link>
        </section>
      </div>
    </div>
  );
}
