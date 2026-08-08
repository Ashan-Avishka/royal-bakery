"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 10;

export function PaymentStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!active) {
      attemptsRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active, router]);

  return null;
}
