// client/src/components/admin/CustomerDetailPanel.tsx
import { Badge } from "@/components/ui/Badge";
import type { AdminCustomer } from "@/lib/admin/customers";

export function CustomerDetailPanel({
  customer,
  isSelf,
}: {
  customer: AdminCustomer;
  isSelf: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="font-display text-lg text-cocoa">
          {customer.fullName?.trim() || "Unnamed user"}
        </p>
        <Badge tone={customer.role === "admin" ? "honey" : "muted"}>
          {customer.role}
        </Badge>
        {isSelf && <Badge tone="success">You</Badge>}
      </div>

      <dl className="grid grid-cols-1 gap-4 text-sm">
        <div>
          <dt className="text-text-muted">Phone</dt>
          <dd className="font-medium text-cocoa">{customer.phone || "No phone"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Address</dt>
          <dd className="font-medium text-cocoa">{customer.address || "No address"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Joined</dt>
          <dd className="font-medium text-cocoa">
            {new Date(customer.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </dd>
        </div>
      </dl>
    </div>
  );
}
