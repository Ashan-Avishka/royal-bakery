"use client";

import { Button } from "@/components/ui/Button";

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center px-4 py-12 sm:px-6">
      <div className="max-w-md space-y-4">
        <h1 className="font-display text-3xl font-semibold text-cocoa">Unable to load this page</h1>
        <p className="text-text-muted">Please try again in a moment.</p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
