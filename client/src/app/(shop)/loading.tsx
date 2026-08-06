export default function ShopLoading() {
  return (
    <div
      role="status"
      aria-label="Loading storefront"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-cream"
    >
      <div className="h-10 border-b border-border-warm bg-honey-light/60" />
      <div className="h-16 border-b border-border-warm bg-cream-alt" />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
        <div className="h-8 w-48 bg-honey-light" />
        <div className="h-5 max-w-xl bg-honey-light/70" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="aspect-4/5 border border-border-warm bg-cream-alt" />
          ))}
        </div>
      </div>
    </div>
  );
}
