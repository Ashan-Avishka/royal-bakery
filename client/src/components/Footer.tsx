export function Footer() {
  return (
    <footer className="border-t border-border-warm bg-cream-alt">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base text-cocoa">Royal Bakery</p>
        <p>Freshly baked in Colombo, Sri Lanka.</p>
        <p>&copy; {new Date().getFullYear()} Royal Bakery. All rights reserved.</p>
      </div>
    </footer>
  );
}
