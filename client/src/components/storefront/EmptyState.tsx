import Link from "next/link";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <section className="border-y border-border-warm py-12 text-center">
      <h2 className="font-display text-2xl text-cocoa">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-text-muted">{description}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-caramel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
