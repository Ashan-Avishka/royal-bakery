"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, {
    error: null,
  });

  if (state.message) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <div className="mx-auto flex items-center gap-3">
          <span className="h-px w-8 bg-caramel/60" aria-hidden />
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">
            Almost there
          </p>
          <span className="h-px w-8 bg-caramel/60" aria-hidden />
        </div>
        <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-cocoa">
          Check your email
        </h1>
        <p className="text-sm leading-relaxed text-text-muted">{state.message}</p>
        <Link
          href="/login"
          className="font-medium text-caramel transition-colors hover:text-caramel-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-caramel/60" aria-hidden />
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-caramel">
            Join us
          </p>
        </div>
        <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-cocoa">
          Create an account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Sign up to place orders and track them from your account.
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

      <form action={formAction} className="flex min-w-0 flex-col gap-4">
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
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="text-sm text-text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-caramel transition-colors hover:text-caramel-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
