"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteButton({
  label,
  confirmMessage,
  action,
}: {
  label: string;
  confirmMessage: string;
  action: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      className="border-red-200 text-red-700 hover:bg-red-50"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}
