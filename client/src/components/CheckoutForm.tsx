"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(placeOrder, {
    error: null,
  });

  return (
    <form
      action={formAction}
      aria-busy={pending}
      aria-labelledby="fulfilment-details-heading"
      className="flex flex-col gap-6 rounded-lg border border-border-warm bg-cream-alt p-5 sm:p-6"
    >
      <div>
        <h2
          id="fulfilment-details-heading"
          className="font-display text-xl text-cocoa"
        >
          Fulfilment details
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          We will prepare your order for pickup unless you add a delivery address.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="deliveryAddress"
          className="text-sm font-medium text-cocoa"
        >
          Delivery address (optional)
        </label>
        <textarea
          id="deliveryAddress"
          name="deliveryAddress"
          rows={3}
          placeholder="Leave blank to pick up in-store"
          aria-describedby="delivery-address-guidance"
          className="min-h-28 rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-sm text-cocoa placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
        />
        <p id="delivery-address-guidance" className="text-xs text-text-muted">
          Leave blank for pickup from our bakery.
        </p>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-cocoa py-3 text-cream-alt hover:bg-cocoa-dark"
      >
        {pending ? "Placing order..." : "Place order"}
      </Button>
    </form>
  );
}
