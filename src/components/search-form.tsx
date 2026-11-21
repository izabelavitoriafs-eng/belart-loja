import { Search } from "lucide-react";

// Formulário simples (GET /busca?q=...) — funciona mesmo sem JavaScript.
export function SearchForm({ id, defaultValue = "" }: { id: string; defaultValue?: string }) {
  return (
    <form action="/busca" method="get" role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        Buscar produtos
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Buscar canecas, garrafas, blusas…"
        maxLength={80}
        className="h-11 w-full rounded-full border border-lilas-300 bg-lilas-50 pr-12 pl-4 text-[0.95rem] placeholder:text-tinta-suave focus:border-ameixa-700 focus:bg-white focus:outline-none"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-ameixa-800 text-white hover:bg-ameixa-700"
        aria-label="Buscar"
      >
        <Search aria-hidden className="size-4" />
      </button>
    </form>
  );
}
