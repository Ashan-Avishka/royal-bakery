export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-honey-light" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-honey-light/70" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-honey-light/70" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-honey-light/70" />
      </div>
    </div>
  );
}
