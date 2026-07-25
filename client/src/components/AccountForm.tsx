"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Profile {
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
}

export function AccountForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-cocoa">Email</p>
        <p className="text-sm text-text-muted">{profile.email}</p>
      </div>

      <Input
        label="Full name"
        name="fullName"
        defaultValue={profile.fullName ?? ""}
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={profile.phone ?? ""}
      />
      <Input
        label="Address"
        name="address"
        defaultValue={profile.address ?? ""}
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-700">Profile updated.</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
