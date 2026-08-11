import Link from "next/link";
import type { ReactNode } from "react";

const DEFAULT_PANEL_CLASSNAME =
  "rounded-lg border border-border-warm bg-cream-alt p-6 shadow-sm";
const DEFAULT_PLACEHOLDER_CLASSNAME =
  "hidden rounded-lg border border-dashed border-border-warm bg-cream-alt/50 p-6 text-center text-sm text-text-muted lg:block";

export function DetailPanel({
  title,
  closeHref,
  className = DEFAULT_PANEL_CLASSNAME,
  children,
}: {
  title: string;
  closeHref: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 lg:sticky lg:top-24 ${className}`}>
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <h2 className="min-w-0 break-words font-display text-xl text-cocoa">{title}</h2>
        <Link
          href={closeHref}
          aria-label="Close details"
          className="touch-target hidden items-center justify-center rounded-full p-1 text-text-muted transition-colors hover:bg-honey-light/50 hover:text-cocoa lg:inline-flex"
        >
          ✕
        </Link>
        <Link
          href={closeHref}
          className="inline-flex min-h-11 items-center text-sm font-medium text-caramel transition-colors hover:text-caramel-hover lg:hidden"
        >
          ← Back to list
        </Link>
      </div>
      {children}
    </div>
  );
}

export function DetailPanelPlaceholder({
  message,
  className = DEFAULT_PLACEHOLDER_CLASSNAME,
}: {
  message: string;
  className?: string;
}) {
  return <div className={className}>{message}</div>;
}
