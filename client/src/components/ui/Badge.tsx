import { HTMLAttributes } from "react";

type BadgeTone = "honey" | "muted" | "success" | "warning";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  honey: "bg-honey-light text-cocoa-dark",
  muted: "bg-border-warm text-text-muted",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
};

export function Badge({
  tone = "honey",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
