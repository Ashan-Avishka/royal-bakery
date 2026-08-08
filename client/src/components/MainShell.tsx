"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main className={`flex-1 ${isHome ? "" : "pt-[4.75rem] sm:pt-[5.25rem]"}`}>
      {children}
    </main>
  );
}
