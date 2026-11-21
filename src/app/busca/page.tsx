import type { Metadata } from "next";
import { getAllProducts, normalize } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { SearchForm } from "@/components/search-form";
import { SortFilter, applySortFilter, parseSort } from "@/components/sort-filter";

export const metadata: Metadata = {
  title: "Buscar produtos",
  robots: { index: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const term = typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
  const sort = parseSort(query.ordem);
  const onlyAvailable = query.disponiveis === "1";

  // Busca em memória sobre o catálogo em cache: rápida e sem diferenciar
  // acentos ("xicara" encontra "Xícara"). Todas as palavras precisam aparecer.
  const words = normalize(term).split(/\s+/).filter(Boolean);
  const products = words.length
    ? applySortFilter(
        (await getAllProducts()).filter((p) => {
          const haystack = normalize(`${p.name} ${p.description} ${p.category.name}`);
          return words.every((w) => haystack.includes(w));
        }),
        sort,
        onlyAvailable,
      )
    : [];

  return (
    <>
      <section className="bg-gradient-to-br from-ameixa-900 via-ameixa-800 to-ameixa-600 text-white">
        <div className="container-loja py-10 md:py-14">
          <h1 className="text-4xl font-extrabold">Buscar produtos</h1>
          <div className="mt-6 max-w-xl">
            <SearchForm id="busca-pagina" defaultValue={term} />
          </div>
        </div>
      </section>

      <section className="container-loja">
        {term && (
          <div className="mt-10">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <p className="text-tinta-suave" role="status">
                {products.length === 0
                  ? `Nenhum produto encontrado para “${term}”.`
                  : `${products.length} ${products.length === 1 ? "resultado" : "resultados"} para “${term}”`}
              </p>
              {(products.length > 0 || onlyAvailable) && (
                <SortFilter sort={sort} onlyAvailable={onlyAvailable} hidden={{ q: term }} />
              )}
            </div>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <p className="text-tinta-suave">Tente outra palavra, como “caneca” ou “blusa”.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
