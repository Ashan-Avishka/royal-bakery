import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/lib/orders";

const statusConfig: Record<
  OrderStatus,
  { label: string; tone: "honey" | "success" | "muted" | "warning" }
> = {
  pending: { label: "Pending", tone: "honey" },
  processing: { label: "Processing", tone: "honey" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
