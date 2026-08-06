"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface MotionContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerGrid({ children, className }: MotionContainerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.2, once: true }}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: reducedMotion ? 0 : 0.08 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: MotionContainerProps) {
  const reducedMotion = useReducedMotion();
  const visible = { opacity: 1, y: 0 };
  const hidden = { opacity: 0, y: reducedMotion ? 0 : 18 };

  return (
    <motion.div
      className={className}
      variants={{ hidden, visible }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
