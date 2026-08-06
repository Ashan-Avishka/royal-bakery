"use client";

import { useActionState } from "react";
import {
  updateOrderStatus,
  type UpdateOrderStatusState,
} from "@/app/actions/admin/orders";
import { Button } from "@/components/ui/Button";
import type { OrderStatus } from "@/lib/orders";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const initialState: UpdateOrderStatusState = { error: null, success: false };

export function UpdateOrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const action = updateOrderStatus.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-cocoa">
            Update status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            disabled={pending}
            className="rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending} className="sm:mb-0.5">
          {pending ? "Saving…" : "Save status"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-sm text-emerald-700">Status updated.</p>
      )}
    </form>
  );
}
