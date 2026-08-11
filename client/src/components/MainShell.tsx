"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SITE_HEADER_HEIGHT } from "@/components/SiteNav";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main className="flex-1" style={isHome ? undefined : { paddingTop: SITE_HEADER_HEIGHT }}>
      {children}
    </main>
  );
}
