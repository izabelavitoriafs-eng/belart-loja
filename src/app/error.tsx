"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-loja py-24 md:py-32">
      <h1 className="text-4xl font-extrabold text-ameixa-900">Não foi possível carregar esta página</h1>
      <p className="mt-3 max-w-md text-tinta-suave">
        Houve uma falha ao buscar as informações. Tente novamente em alguns instantes.
      </p>
      <button type="button" onClick={reset} className="btn-sol mt-8">
        Tentar novamente
      </button>
    </div>
  );
}
