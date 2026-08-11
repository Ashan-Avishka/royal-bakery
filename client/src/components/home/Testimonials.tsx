"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SectionHeader } from "@/components/home/SectionHeader";

const menuNotes = [
  { message: "Browse the menu to view available bakery products.", name: "Royal Bakery menu", place: "Online ordering" },
  { message: "Product details and availability are shown with each menu item.", name: "Product information", place: "Menu details" },
  { message: "Review your order details before completing checkout.", name: "Checkout", place: "Order details" },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const item = menuNotes[index];
  useEffect(() => { if (reduceMotion) return; const id = window.setInterval(() => setIndex((value) => (value + 1) % menuNotes.length), 7500); return () => window.clearInterval(id); }, [reduceMotion]);
  if (!item) return null;

  return <section className="relative overflow-hidden py-20 sm:py-24"><div className="ambient-blur pointer-events-none absolute -left-10 top-24 h-56 w-56 rounded-full bg-honey/35 blur-3xl float-slow" aria-hidden /><div className="ambient-blur pointer-events-none absolute -right-8 bottom-8 h-64 w-64 rounded-full bg-caramel/10 blur-3xl float-slower" aria-hidden /><div className="relative mx-auto max-w-6xl px-4 sm:px-6"><SectionHeader eyebrow="The menu" title="Browse with confidence" /><div className="elevated-surface relative overflow-hidden rounded-[1.5rem] border border-border-warm/80 bg-gradient-to-br from-cream-alt via-cream to-honey-light/30 px-6 py-14 shadow-[0_24px_60px_-36px_rgba(58,26,19,0.35)] sm:px-14 sm:py-20"><div className="mx-auto max-w-3xl text-center"><AnimatePresence mode="wait" initial={false}><motion.div key={item.name} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}><p className="font-display text-2xl font-medium italic leading-[1.35] tracking-tight text-cocoa sm:text-[1.85rem]">{item.message}</p><div className="mt-10 flex flex-col items-center gap-2"><span className="h-px w-10 bg-border-warm" aria-hidden /><p className="text-[13px] tracking-[0.12em] text-caramel-hover">{item.name}</p><p className="text-[13px] text-text-muted">{item.place}</p></div></motion.div></AnimatePresence></div><div className="mt-12 flex justify-center gap-2.5">{menuNotes.map((note, noteIndex) => <button key={note.name} type="button" aria-label={`Show ${note.name}`} aria-current={noteIndex === index} onClick={() => setIndex(noteIndex)} className={`h-px transition-all duration-300 ${noteIndex === index ? "w-10 bg-caramel" : "w-5 bg-border-warm hover:bg-caramel/40"}`} />)}</div></div></div></section>;
}
