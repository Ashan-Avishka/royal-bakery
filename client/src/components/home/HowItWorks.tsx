import Link from "next/link";
import { SectionHeader } from "@/components/home/SectionHeader";

const steps = [
  {
    title: "Browse the menu",
    detail:
      "See what's baking today — cakes, pastries, bread, and seasonal specials, updated as they leave the oven.",
  },
  {
    title: "Place your order",
    detail:
      "Add to cart, choose pickup or delivery, and check out in a few quiet taps.",
  },
  {
    title: "Enjoy it fresh",
    detail:
      "We time each bake so your box arrives warm — never sitting on a shelf waiting.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-y border-border-warm/70 bg-gradient-to-b from-honey-light/25 to-cream">
      <div
        className="pointer-events-none absolute left-[8%] top-16 h-40 w-40 rounded-full bg-honey/40 blur-3xl float-slow"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[12%] bottom-10 h-52 w-52 rounded-full bg-caramel/15 blur-3xl float-slower"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <SectionHeader
          eyebrow="The experience"
          title="From oven to you"
          description="A considered order flow — built for busy mornings and celebrations planned weeks ahead."
        />

        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              {i < steps.length - 1 && (
                <span
                  className="absolute right-0 top-5 hidden h-px w-1/3 bg-border-warm md:block"
                  aria-hidden
                />
              )}
              <p className="font-display text-[11px] tracking-[0.28em] text-caramel/60">
                Step {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-xl font-medium text-cocoa sm:text-[1.35rem]">
                {step.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-text-muted sm:text-[15px]">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 border-b border-caramel/30 pb-0.5 text-sm tracking-wide text-caramel transition-colors duration-300 hover:border-caramel hover:text-caramel-hover"
          >
            Begin an order
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
