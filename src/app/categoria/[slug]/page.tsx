import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getCategoryBySlug } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { CategoryIcon } from "@/components/category-icon";
import { SortFilter, applySortFilter, parseSort } from "@/components/sort-filter";
import { whatsappLink } from "@/config/site";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} | Produtos personalizados`,
    description: category.description ?? undefined,
    alternates: { canonical: `/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [category, allProducts] = await Promise.all([getCategoryBySlug(slug), getAllProducts()]);
  if (!category) notFound();

  const sort = parseSort(query.ordem);
  const onlyAvailable = query.disponiveis === "1";
  const products = applySortFilter(
    allProducts.filter((p) => p.category.slug === category.slug),
    sort,
    onlyAvailable,
  );

  return (
    <>
      {/* Faixa de título com degradê */}
      <section className="bg-gradient-to-br from-ameixa-900 via-ameixa-800 to-ameixa-600 text-white">
        <div className="container-loja relative overflow-hidden py-8 md:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full bg-lilas-300/20 blur-3xl"
          />
          <nav aria-label="Você está em" className="relative text-sm text-lilas-200">
            <ol className="flex gap-2">
              <li>
                <Link href="/" className="hover:text-white">
                  Início
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-medium text-white">
                {category.name}
              </li>
            </ol>
          </nav>
          <div className="relative mt-5 flex items-center gap-5">
            <span className="hidden size-16 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 sm:flex">
              <CategoryIcon slug={category.slug} className="size-8 text-sol-400" />
            </span>
            <div className="max-w-2xl">
              <h1 className="text-4xl font-extrabold md:text-5xl">{category.name}</h1>
              {category.description && <p className="mt-2 text-lg text-lilas-100">{category.description}</p>}
            </div>
          </div>

        </div>
      </section>

      <section className="bg-gradient-to-b from-lilas-50 to-white">
        <div className="container-loja pt-8 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <p className="text-sm text-tinta-suave" role="status">
              {products.length} {products.length === 1 ? "produto" : "produtos"}
            </p>
            <SortFilter sort={sort} onlyAvailable={onlyAvailable} />
          </div>

          <div className="pt-8">
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="rounded-[var(--radius-bloco)] bg-white px-6 py-14 text-center shadow-[0_10px_40px_-20px_rgb(62_10_71/0.35)] ring-1 ring-lilas-200">
                <h2 className="text-2xl font-bold text-ameixa-900">
                  {onlyAvailable ? "Nenhum produto disponível agora" : "Produtos em breve"}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-tinta-suave">
                  Conte o que você precisa e peça um orçamento pelo WhatsApp.
                </p>
                <a
                  href={whatsappLink(`Olá, Belart! Tenho interesse em produtos da categoria ${category.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sol mt-6"
                >
                  Pedir orçamento
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
