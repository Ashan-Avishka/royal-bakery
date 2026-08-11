import Link from "next/link";

export function NewsletterCta() {
  return (
    <section className="relative overflow-hidden bg-cocoa">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse 60% 80% at 12% 50%, rgba(182,126,75,0.28), transparent), radial-gradient(ellipse 45% 60% at 88% 20%, rgba(243,195,135,0.12), transparent)" }} aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-5 flex items-center gap-3"><span className="h-px w-8 bg-honey/50" aria-hidden /><p className="font-display text-[11px] uppercase tracking-[0.28em] text-honey">Ready when you are</p></div>
          <h2 className="font-display text-[2rem] font-medium leading-[1.15] tracking-tight text-cream text-balance sm:text-4xl">Browse the menu and order online.</h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-honey-light/75">Browse the current menu and place an order online. Available fulfilment options are shown during checkout.</p>
        </div>
        <Link href="/products" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-honey px-8 py-3.5 text-[13px] font-medium tracking-[0.08em] text-cocoa-dark transition-colors duration-300 hover:bg-honey-light">Shop the full menu</Link>
      </div>
    </section>
  );
}
