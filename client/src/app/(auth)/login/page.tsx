"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, {
    error: null,
  });

  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-caramel/60" aria-hidden />
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">
            Welcome back
          </p>
        </div>
        <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-cocoa">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Sign in to view your account, cart, and orders.
        </p>
      </div>

      <GoogleSignInButton />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border-warm/70" aria-hidden />
        <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-border-warm/70" aria-hidden />
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

        {state.error && (
          <p className="rounded-[0.85rem] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 w-full py-3 text-[13px] tracking-[0.06em]"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-caramel transition-colors hover:text-caramel-hover"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
