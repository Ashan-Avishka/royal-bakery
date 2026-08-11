"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(placeOrder, { error: null });

  return (
    <form action={formAction} aria-label="Fulfilment details" aria-busy={pending} className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-medium text-cocoa">Fulfilment details</h2>
        <p className="mt-1 text-sm text-text-muted">Choose delivery or leave the address blank for pickup.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deliveryAddress" className="text-sm font-medium text-cocoa">Delivery address (optional)</label>
        <textarea
          id="deliveryAddress"
          name="deliveryAddress"
          rows={3}
          placeholder="Leave blank to pick up in-store"
          className="min-h-28 rounded-[1.15rem] border border-border-warm bg-cream-alt px-4 py-2.5 text-base text-cocoa placeholder:text-text-muted transition-colors focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30 sm:text-sm"
        />
        <p className="text-xs text-text-muted">Leave blank for pickup from our bakery.</p>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full py-3">
        {pending ? "Placing order..." : "Place order"}
      </Button>
    </form>
  );
}
