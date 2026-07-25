"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, {
    error: null,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-cocoa">Sign in</h1>
        <p className="mt-1 text-sm text-text-muted">
          Welcome back — sign in to view your account and orders.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full py-3">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-caramel hover:text-caramel-hover"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
