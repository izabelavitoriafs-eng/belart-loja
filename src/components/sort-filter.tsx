// Ordenação e filtro por disponibilidade via parâmetros de URL (GET).
// Funciona sem JavaScript: o cliente escolhe e clica em "Aplicar".
// A ordenação acontece em memória, sobre o catálogo em cache (sem ir ao banco).
import type { ProductCardData } from "@/lib/catalog";

type Sorter = (a: ProductCardData, b: ProductCardData) => number;

export const sortOptions = {
  novidades: { label: "Mais recentes", compare: ((a, b) => b.createdAt.localeCompare(a.createdAt)) as Sorter },
  "menor-preco": { label: "Menor preço", compare: ((a, b) => a.price - b.price) as Sorter },
  "maior-preco": { label: "Maior preço", compare: ((a, b) => b.price - a.price) as Sorter },
  nome: { label: "Nome (A–Z)", compare: ((a, b) => a.name.localeCompare(b.name, "pt-BR")) as Sorter },
};

export type SortKey = keyof typeof sortOptions;

export function parseSort(value: string | string[] | undefined): SortKey {
  return typeof value === "string" && value in sortOptions ? (value as SortKey) : "novidades";
}

export function applySortFilter(products: ProductCardData[], sort: SortKey, onlyAvailable: boolean) {
  return products.filter((p) => !onlyAvailable || p.available).sort(sortOptions[sort].compare);
}

export function SortFilter({
  sort,
  onlyAvailable,
  hidden = {},
}: {
  sort: SortKey;
  onlyAvailable: boolean;
  hidden?: Record<string, string>;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label className="grid gap-1">
        <span className="font-medium text-tinta-suave">Ordenar por</span>
        <select
          name="ordem"
          defaultValue={sort}
          className="h-10 rounded-full border border-lilas-300 bg-white px-4 focus:border-ameixa-700 focus:outline-none"
        >
          {Object.entries(sortOptions).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex h-10 items-center gap-2 rounded-full border border-lilas-300 bg-white px-4">
        <input
          type="checkbox"
          name="disponiveis"
          value="1"
          defaultChecked={onlyAvailable}
          className="size-4 accent-ameixa-800"
        />
        Só disponíveis
      </label>
      <button type="submit" className="btn-roxo h-10 px-5 py-0 text-sm">
        Aplicar
      </button>
    </form>
  );
}
