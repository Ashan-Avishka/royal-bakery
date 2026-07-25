import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-semibold text-cocoa"
      >
        Royal Bakery
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border-warm bg-cream-alt p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
