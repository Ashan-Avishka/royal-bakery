import { BrandLogo } from "@/components/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-6 py-12">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-honey/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-caramel/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-8">
        <BrandLogo size="lg" priority />
      </div>

      <div className="relative w-full max-w-md rounded-[1.5rem] border border-border-warm/80 bg-cream-alt/95 p-8 shadow-[0_24px_50px_-28px_rgba(58,26,19,0.35)] backdrop-blur-sm sm:p-10">
        {children}
      </div>
    </div>
  );
}
