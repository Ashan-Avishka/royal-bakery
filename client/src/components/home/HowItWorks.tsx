import Link from "next/link";
import { SectionHeader } from "@/components/home/SectionHeader";

const steps = [
  { title: "Browse the menu", detail: "Browse available products, including cakes, pastries, breads, and sweets." },
  { title: "Place your order", detail: "Add your selection to the cart and complete checkout online." },
  { title: "Review your order", detail: "Check the order details and fulfilment information provided at checkout." },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-y border-border-warm/70 bg-gradient-to-b from-honey-light/25 to-cream">
      <div className="ambient-blur pointer-events-none absolute left-[8%] top-16 h-40 w-40 rounded-full bg-honey/40 blur-3xl float-slow" aria-hidden />
      <div className="ambient-blur pointer-events-none absolute right-[12%] bottom-10 h-52 w-52 rounded-full bg-caramel/15 blur-3xl float-slower" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeader eyebrow="The experience" title="From menu to checkout" description="Browse products, place an order, and review the details at checkout." />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              {i < steps.length - 1 && <span className="absolute right-0 top-5 hidden h-px w-1/3 bg-border-warm md:block" aria-hidden />}
              <p className="font-display text-[11px] tracking-[0.28em] text-cocoa">Step {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 font-display text-xl font-medium text-cocoa sm:text-[1.35rem]">{step.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-text-muted sm:text-[15px]">{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Link href="/products" className="group inline-flex min-h-11 items-center gap-2 border-b border-caramel/30 pb-0.5 text-sm tracking-wide text-caramel-hover transition-colors duration-300 hover:border-caramel hover:text-cocoa">
            Begin an order <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
