import { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border-warm bg-cream-alt shadow-sm ${className}`}
      {...props}
    />
  );
}
