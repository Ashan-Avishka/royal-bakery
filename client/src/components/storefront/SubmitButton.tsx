"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export interface SubmitButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, "children"> {
  idleLabel: string;
  pendingLabel: string;
}

export function SubmitButton({
  idleLabel,
  pendingLabel,
  disabled,
  ...buttonProps
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} {...buttonProps}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
