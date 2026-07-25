"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, {
    error: null,
  });

  if (state.message) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-display text-2xl text-cocoa">Check your email</h1>
        <p className="text-sm text-text-muted">{state.message}</p>
        <Link
          href="/login"
          className="font-medium text-caramel hover:text-caramel-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-cocoa">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Sign up to place orders and track them from your account.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Full name"
          name="fullName"
          type="text"
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Input label="Phone" name="phone" type="tel" autoComplete="tel" />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full py-3">
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="text-sm text-text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-caramel hover:text-caramel-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
