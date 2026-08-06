import { Badge } from "@/components/ui/Badge";
import type { PaymentStatus } from "@/lib/orders";

const statusConfig: Record<
  PaymentStatus,
  { label: string; tone: "honey" | "success" | "muted" | "warning" }
> = {
  unpaid: { label: "Unpaid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "muted" },
  refunded: { label: "Refunded", tone: "muted" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
