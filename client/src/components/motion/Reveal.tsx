"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
}: RevealProps) {
  const reducedMotion = useReducedMotion();
  const visible = { opacity: 1, y: 0 };
  const hidden = { opacity: 0, y: reducedMotion ? 0 : 18 };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.2, once }}
      variants={{ hidden, visible }}
      transition={{ delay: reducedMotion ? 0 : delay, duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
