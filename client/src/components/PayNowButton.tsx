"use client";

import { useActionState, useEffect, useRef } from "react";
import { initiatePaymentAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/Button";

const PAYHERE_FIELDS: Record<string, string> = {
  merchantId: "merchant_id",
  returnUrl: "return_url",
  cancelUrl: "cancel_url",
  notifyUrl: "notify_url",
  orderId: "order_id",
  items: "items",
  currency: "currency",
  amount: "amount",
  hash: "hash",
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
  phone: "phone",
  address: "address",
  city: "city",
  country: "country",
};

export function PayNowButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(initiatePaymentAction, {
    payment: null,
    error: null,
  });
  const redirectFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.payment) {
      redirectFormRef.current?.submit();
    }
  }, [state.payment]);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <Button type="submit" disabled={pending || !!state.payment} className="w-full py-3">
          {pending || state.payment ? "Redirecting to PayHere…" : "Pay now"}
        </Button>
      </form>

      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {state.payment && (
        <form
          ref={redirectFormRef}
          action={state.payment.checkoutUrl}
          method="POST"
          className="hidden"
        >
          {Object.entries(PAYHERE_FIELDS).map(([key, fieldName]) => (
            <input
              key={fieldName}
              type="hidden"
              name={fieldName}
              value={state.payment![key as keyof typeof state.payment] as string}
            />
          ))}
        </form>
      )}
    </div>
  );
}
