import Link from "next/link";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: {
    href: string;
    label: string;
  };
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-caramel/60" aria-hidden />
            <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">
              {eyebrow}
            </p>
          </div>
        )}
        <h1 className="break-words font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cocoa text-balance sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex w-full min-w-0 sm:w-auto">
          <Link
            href={action.href}
            className="group inline-flex min-h-11 w-full items-center justify-between gap-2 border-b border-caramel/30 pb-0.5 text-sm tracking-wide text-caramel transition-colors duration-300 hover:border-caramel hover:text-caramel-hover sm:w-auto"
          >
            {action.label}
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
            →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
