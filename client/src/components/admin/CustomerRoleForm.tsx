"use client";

import { useActionState } from "react";
import {
  updateCustomerRole,
  type UpdateCustomerRoleState,
} from "@/app/actions/admin/customers";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/lib/admin/customers";

const initialState: UpdateCustomerRoleState = {
  error: null,
  success: false,
};

export function CustomerRoleForm({
  customerId,
  currentRole,
  isSelf,
}: {
  customerId: string;
  currentRole: UserRole;
  isSelf: boolean;
}) {
  const action = updateCustomerRole.bind(null, customerId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const locked = isSelf && currentRole === "admin";

  return (
    <form
      action={formAction}
      className="flex flex-col items-stretch gap-1 sm:items-end"
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="role"
          defaultValue={currentRole}
          disabled={pending || locked}
          className="min-h-11 rounded-lg border border-border-warm bg-white px-3 py-2 text-base text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel disabled:opacity-60 sm:text-sm"
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <Button
          type="submit"
          variant="secondary"
          disabled={pending || locked}
          className="px-4 py-2"
        >
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
      {locked && (
        <p className="text-xs text-text-muted">You cannot demote yourself</p>
      )}
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-xs text-emerald-700">Role updated.</p>
      )}
    </form>
  );
}
