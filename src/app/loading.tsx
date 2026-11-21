export default function Loading() {
  return (
    <div className="container-loja pt-10" role="status" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="h-10 w-64 animate-pulse rounded-full bg-lilas-100" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-3xl bg-lilas-50" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-lilas-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
