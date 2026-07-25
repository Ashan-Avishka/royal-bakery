import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-border-warm bg-cream-alt/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-cocoa"
        >
          Royal Bakery
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cocoa transition-colors hover:text-caramel"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-cocoa transition-colors hover:text-caramel"
              >
                Account
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" className="px-4 py-2">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-cocoa transition-colors hover:text-caramel"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button className="px-4 py-2">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
